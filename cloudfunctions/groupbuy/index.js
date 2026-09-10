const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const MAX_PAGE = 20;

function me() { return cloud.getWXContext().OPENID; }
function now() { return db.serverDate(); }
function page(e) { return Math.max(1, Number(e.page) || 1); }
function qty(v) { return Math.max(1, Math.min(999, Number(v) || 1)); }

exports.main = async (e = {}) => {
  const action = e.action;
  const openid = me();
  try {
    if (action === 'create') {
      const title = String(e.title || '').trim().slice(0, 80);
      if (!title) return { success: false, message: '请填写团购名称' };
      const endAt = e.endAt ? new Date(e.endAt) : null;
      if (endAt && Number.isNaN(endAt.getTime())) return { success: false, message: '截止时间格式不正确' };
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
      return { success: true, data: r.data };
    }

    if (action === 'detail') {
      const id = String(e.id || '');
      if (!id) return { success: false, message: '团购不存在' };
      const group = (await db.collection('group_buys').doc(id).get()).data;
      if (!group) return { success: false, message: '团购不存在' };
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
      const old = await db.collection('group_buy_members').where({ groupId: id, openid }).limit(1).get();
      if (old.data.length) {
        await db.collection('group_buy_members').doc(old.data[0]._id).update({ data: { qty: amount, name, note: String(e.note || '').slice(0, 100), updatedAt: now() } });
      } else {
        await db.collection('group_buy_members').add({ data: { groupId: id, openid, name, qty: amount, note: String(e.note || '').slice(0, 100), role: 'member', createdAt: now(), updatedAt: now() } });
      }
      const members = (await db.collection('group_buy_members').where({ groupId: id }).limit(100).get()).data;
      const totalQty = members.reduce((n, x) => n + (Number(x.qty) || 0), 0);
      const participantCount = members.filter(x => Number(x.qty) > 0).length;
      await db.collection('group_buys').doc(id).update({ data: { totalQty, participantCount, updatedAt: now() } });
      return { success: true, qty: amount, totalQty, participantCount };
    }

    if (action === 'leave') {
      const id = String(e.id || '');
      const old = await db.collection('group_buy_members').where({ groupId: id, openid }).limit(1).get();
      if (old.data.length) await db.collection('group_buy_members').doc(old.data[0]._id).remove();
      const members = (await db.collection('group_buy_members').where({ groupId: id }).limit(100).get()).data;
      await db.collection('group_buys').doc(id).update({ data: {
        totalQty: members.reduce((n, x) => n + (Number(x.qty) || 0), 0),
        participantCount: members.filter(x => Number(x.qty) > 0).length,
        updatedAt: now()
      }});
      return { success: true };
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
