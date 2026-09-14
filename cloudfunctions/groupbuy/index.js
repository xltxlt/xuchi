const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const MAX_PAGE = 20;

function me() { return cloud.getWXContext().OPENID; }
function now() { return db.serverDate(); }
function page(e) { return Math.max(1, Number(e.page) || 1); }
function qty(v) { return Math.max(1, Math.min(999, Number(v) || 1)); }
function validEndAt(v) { const d=v instanceof Date?v:new Date(v); return d && !Number.isNaN(d.getTime()) ? d : null; }
function isExpired(group) { return group && group.endAt && new Date(group.endAt).getTime() <= Date.now(); }

exports.main = async (e = {}) => {
  const action = e.action;
  const openid = me();
  try {
    if (action === 'create') {
      const title = String(e.title || '').trim().slice(0, 80);
      if (!title) return { success: false, message: '请填写团购名称' };
      const endAt = e.endAt ? validEndAt(e.endAt) : null;
      if (e.endAt && !endAt) return { success: false, message: '截止时间格式不正确' };
      if (endAt && endAt.getTime() <= Date.now()) return { success: false, message: '截止时间必须晚于当前时间' };
      const r = await db.collection('group_buys').add({ data: {
        title,
        dishId: Number(e.dishId) || 0,
        dishName: String(e.dishName || '').slice(0, 80),
        storeId: Number(e.storeId) || 0,
        storeName: String(e.storeName || '').slice(0, 80),
        unit: String(e.unit || '份').slice(0, 10),
        price: Number(e.price) || 0,
        endAt: endAt ? db.serverDate({ offset: endAt.getTime() - Date.now() }) : null,
        status: 'open',
        creatorId: openid,
        creatorName: String(e.creatorName || '发起人').slice(0, 30),
        totalQty: 0,
        participantCount: 0,
        createdAt: now(),
        updatedAt: now()
      }});
      await db.collection('group_buy_members').add({ data: {
        groupId: r._id, openid, name: String(e.creatorName || '发起人').slice(0, 30), qty: 0, note: '', role: 'owner', createdAt: now(), updatedAt: now()
      }});
      return { success: true, id: r._id };
    }

    if (action === 'list') {
      const r = await db.collection('group_buys').where({ status: 'open' }).orderBy('createdAt', 'desc').skip((page(e) - 1) * MAX_PAGE).limit(MAX_PAGE).get();
      const expired = r.data.filter(isExpired).map(x => x._id);
      if (expired.length) await Promise.all(expired.map(id => db.collection('group_buys').doc(id).update({ data: { status: 'expired', expiredAt: now(), updatedAt: now() } }).catch(() => null)));
      return { success: true, data: r.data.filter(x => expired.indexOf(x._id) < 0) };
    }

    if (action === 'detail') {
      const id = String(e.id || '');
      if (!id) return { success: false, message: '团购不存在' };
      const group = (await db.collection('group_buys').doc(id).get()).data;
      if (!group) return { success: false, message: '团购不存在' };
      if (group.status === 'open' && isExpired(group)) { await db.collection('group_buys').doc(id).update({ data: { status: 'expired', expiredAt: now(), updatedAt: now() } }); group.status = 'expired'; }
      const members = (await db.collection('group_buy_members').where({ groupId: id }).orderBy('updatedAt', 'asc').limit(100).get()).data;
      const mine = members.find(x => x.openid === openid) || null;
      return { success: true, data: { ...group, members, mine } };
    }

    if (action === 'join') {
      const id = String(e.id || '');
      const amount = qty(e.qty);
      const name = String(e.name || '匿名吃货').trim().slice(0, 30) || '匿名吃货';
      const group = (await db.collection('group_buys').doc(id).get()).data;
      if (!group || group.status !== 'open') return { success: false, message: '该团购已结束' };
      const result = await db.runTransaction(async transaction => {
        const txGroup = (await transaction.collection('group_buys').doc(id).get()).data;
        if (!txGroup || txGroup.status !== 'open') throw new Error('该团购已结束');
        if (isExpired(txGroup)) { await transaction.collection('group_buys').doc(id).update({ data: { status: 'expired', expiredAt: now(), updatedAt: now() } }); throw new Error('该团购已过期'); }
        const maxQty = Math.max(0, Number(txGroup.maxQty) || 0);
        const old = await transaction.collection('group_buy_members').where({ groupId: id, openid }).limit(1).get();
        if (old.data.length) {
          await transaction.collection('group_buy_members').doc(old.data[0]._id).update({ data: { qty: amount, name, note: String(e.note || '').slice(0, 100), updatedAt: now() } });
        } else {
          await transaction.collection('group_buy_members').add({ data: { groupId: id, openid, name, qty: amount, note: String(e.note || '').slice(0, 100), role: 'member', createdAt: now(), updatedAt: now() } });
        }
        const oldQty = old.data.length ? Math.max(0, Number(old.data[0].qty) || 0) : 0;
        const totalQty = Math.max(0, Number(txGroup.totalQty) || 0) - oldQty + amount;
        if (maxQty > 0 && totalQty > maxQty) throw new Error('超过团购数量上限');
        const participantCount = Math.max(0, Number(txGroup.participantCount) || 0) + (old.data.length ? 0 : 1);
        const maxParticipants = Math.max(0, Number(txGroup.maxParticipants) || 0);
        if (maxParticipants > 0 && participantCount > maxParticipants) throw new Error('超过团购人数上限');
        await transaction.collection('group_buys').doc(id).update({ data: { totalQty, participantCount, updatedAt: now() } });
        return { totalQty, participantCount };
      });
      return { success: true, qty: amount, ...result };
    }

    if (action === 'leave') {
      const id = String(e.id || '');
      const result = await db.runTransaction(async transaction => {
        const txGroup = (await transaction.collection('group_buys').doc(id).get()).data;
        if (!txGroup) throw new Error('团购不存在');
        if (txGroup.status !== 'open') throw new Error('该团购已结束');
        if (isExpired(txGroup)) throw new Error('该团购已过期');
        const old = await transaction.collection('group_buy_members').where({ groupId: id, openid }).limit(1).get();
        if (old.data.length) await transaction.collection('group_buy_members').doc(old.data[0]._id).remove();
        const oldQty = old.data.length ? Math.max(0, Number(old.data[0].qty) || 0) : 0;
        const hadParticipant = oldQty > 0 ? 1 : 0;
        const totalQty = Math.max(0, Number((await transaction.collection('group_buys').doc(id).get()).data.totalQty || 0) - oldQty);
        const participantCount = Math.max(0, Number((await transaction.collection('group_buys').doc(id).get()).data.participantCount || 0) - hadParticipant);
        await transaction.collection('group_buys').doc(id).update({ data: { totalQty, participantCount, updatedAt: now() } });
        return { totalQty, participantCount };
      });
      return { success: true, ...result };
    }

    if (action === 'close') {
      const id = String(e.id || '');
      const group = (await db.collection('group_buys').doc(id).get()).data;
      if (!group || group.creatorId !== openid) return { success: false, message: '只有发起人可以结束团购' };
      await db.collection('group_buys').doc(id).update({ data: { status: 'closed', closedAt: now(), updatedAt: now() } });
      return { success: true };
    }

    if (action === 'summary') {
      const id = String(e.id || '');
      const group = (await db.collection('group_buys').doc(id).get()).data;
      if (!group) return { success: false, message: '团购不存在' };
      const members = (await db.collection('group_buy_members').where({ groupId: id }).orderBy('updatedAt', 'asc').limit(100).get()).data;
      const active = members.filter(x => Number(x.qty) > 0);
      const totalQty = active.reduce((n, x) => n + Number(x.qty), 0);
      const totalAmount = Number(group.price || 0) * totalQty;
      return { success: true, data: { group, members: active, totalQty, participantCount: active.length, totalAmount } };
    }

    return { success: false, message: '未知操作' };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message || '团购服务异常' };
  }
};
