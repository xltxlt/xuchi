const cloud=require('wx-server-sdk');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
const db=cloud.database();
const _=db.command;
exports.main=async e=>{
 const me=cloud.getWXContext().OPENID;
 const dish=String(e.dish||'').trim().slice(0,100),store=String(e.store||'').trim().slice(0,100);
 if(!dish)return{success:false,message:'菜品名称不能为空'};
 try{
  let dishId=Number(e.dishId)||0;
  let storeId=Number(e.storeId)||0;
  let entityDish=null;
  if(dishId){
   const r=await db.collection('dishes').where({id:dishId}).limit(1).get().catch(()=>({data:[]}));
   entityDish=r.data&&r.data[0]||null;
  }
  if(!entityDish){
   const r=await db.collection('dishes').where({name:dish}).limit(20).get().catch(()=>({data:[]}));
   entityDish=(r.data||[]).find(x=>!store||x.store===store)||r.data&&r.data[0]||null;
   if(entityDish)dishId=Number(entityDish.id)||0;
  }
  if(!storeId&&entityDish)storeId=Number(entityDish.storeId)||0;
  if(!storeId&&store){
   const r=await db.collection('stores').where({name:store}).limit(1).get().catch(()=>({data:[]}));
   storeId=Number(r.data&&r.data[0]&&r.data[0].id)||0;
  }
  const tags=Array.isArray(e.tags)?e.tags.slice(0,10):[];
  const r=await db.collection('posts').add({data:{openid:me,name:dish,dishId,store,storeId,image:e.image||'',tags,vote:['yes','conditional','no'].includes(e.vote)?e.vote:'yes',note:String(e.note||'').trim().slice(0,1000),likes:0,comments:0,createdAt:db.serverDate()}});
  await db.collection('users').doc(me).set({data:{posts:_.inc(1),exp:_.inc(20),updatedAt:db.serverDate()},merge:true});
  return{success:true,id:r._id,dishId,storeId};
 }catch(err){return{success:false,message:err.message||'发布失败'}}
};
