const cloud = require('wx-server-sdk');
const db = cloud.database();

async function profile(id) {
  return (await db.collection('users').doc(id).get().catch(() => ({ data: {} }))).data || {};
}

async function ensureUser(id) {
  await db.collection('users').doc(id).set({
    data: { _id: id, updatedAt: db.serverDate() },
    merge: true
  }).catch(() => {});
}

async function getUserTaste(id) {
  const u = await profile(id);
  return {
    user: u,
    taste: Array.isArray(u.taste) ? u.taste : [],
    tags: Array.isArray(u.tags) ? u.tags : []
  };
}

module.exports = { profile, ensureUser, getUserTaste };
