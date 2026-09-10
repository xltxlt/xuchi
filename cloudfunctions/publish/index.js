const cloud=require('wx-server-sdk');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
const db=cloud.database();
const _=db.command;
exports.main=async e=>{
 const me=cloud.getWXContext().OPENID;
 const dish=String(e.dish||'').trim().slice(0,100),store=String(e.store||'').trim().slice(0,100);
 if(!dish)return{success:false,message:'菜品名称不能为空'};
 try{
  const r=await db.collection('posts').add({data:{openid:me,name:dish,dishId:Number(e.dishId)||0,store,storeId:Number(e.storeId)||0,image:e.image||'',tags:Array.isArray(e.tags)?e.tags.slice(0,10):[],vote:['yes','conditional','no'].includes(e.vote)?e.vote:'yes',note:String(e.note||'').trim().slice(0,1000),likes:0,comments:0,createdAt:db.serverDate()}});
  await db.collection('users').doc(me).set({data:{posts:_.inc(1),exp:_.inc(20),updatedAt:db.serverDate()},merge:true});
  return{success:true,id:r._id};
 }catch(err){return{success:false,message:err.message||'发布失败'}}
};
