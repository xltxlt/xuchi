const cloud=require('wx-server-sdk');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
const db=cloud.database();
const _=db.command;
function clamp(n,a=0,b=99){return Math.max(a,Math.min(b,n))}
async function profile(id){return (await db.collection('users').doc(id).get().catch(()=>({data:{}}))).data||{}}
exports.main=async(e)=>{
 const me=cloud.getWXContext().OPENID,dishId=Number(e.dishId);
 if(!dishId)return{success:false,message:'无效菜品'};
 try{
  const mine=await profile(me),mineTags=new Set([...(mine.taste||[]),...(mine.tags||[])]);
  const [users,actions]=await Promise.all([
   db.collection('users').limit(100).get(),
   db.collection('user_actions').where({dishId}).limit(1000).get()
  ]);
  const actionMap=new Map(actions.data.filter(x=>['yes','conditional','no'].includes(x.type)).map(x=>[x.openid,x.type]));
  const following=(await db.collection('follows').where({openid:me}).limit(1000).get()).data.map(x=>x.targetId);
  const list=users.data.filter(x=>x._id!==me).map(x=>{
   const tags=new Set([...(x.taste||[]),...(x.tags||[])]);
   const common=[...mineTags].filter(v=>tags.has(v));
   const similarity=clamp(Math.round(common.length/Math.max(1,mineTags.size)*100),50,99);
   return{_id:x._id,name:x.name||'美食同好',avatar:x.avatar||'🍜',similarity,common,following:following.includes(x._id),vote:actionMap.get(x._id)||'none'};
  }).filter(x=>x.vote!=='none').sort((a,b)=>b.similarity-a.similarity).slice(0,6);
  const allSimilar=users.data.filter(x=>x._id!==me).map(x=>{
   const tags=new Set([...(x.taste||[]),...(x.tags||[])]),common=[...mineTags].filter(v=>tags.has(v));
   return{openid:x._id,similarity:clamp(Math.round(common.length/Math.max(1,mineTags.size)*100),50,99)};
  }).filter(x=>x.similarity>=70);
  const similarIds=new Set(allSimilar.map(x=>x.openid));
  const hobbyActions=actions.data.filter(x=>similarIds.has(x.openid)&&['yes','conditional','no'].includes(x.type));
  const hobbyCounts={yes:0,conditional:0,no:0};hobbyActions.forEach(x=>hobbyCounts[x.type]++);
  const total=hobbyActions.length,hobbyRate=total?Math.round(hobbyCounts.yes/total*100):0;
  const votesByUser={};actions.data.forEach(x=>{if(['yes','conditional','no'].includes(x.type))votesByUser[x.openid]=x.type});
  return{success:true,data:list,hobbyRate,hobbyCounts,hobbyTotal:total,votesByUser};
 }catch(err){console.error(err);return{success:false,message:'同好数据暂不可用',error:err.message}}
};
