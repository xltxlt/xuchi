const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const MAX_PAGE = 20;

function openid(){ return cloud.getWXContext().OPENID; }
function clamp(n,a=0,b=99){ return Math.max(a,Math.min(b,n)); }
function tagsOf(u){ return [...(u.taste||[]),...(u.tags||[])]; }
function similarity(a,b){
  const x=new Set(tagsOf(a)), y=new Set(tagsOf(b));
  if(!x.size) return 0;
  const common=[...x].filter(v=>y.has(v));
  return clamp(Math.round(common.length/Math.max(1,x.size)*100),50,99);
}
function dishMatch(d,taste=[]){
  const set=new Set(taste), tags=d.tags||[], hit=tags.filter(x=>set.has(x)).length;
  return clamp(Math.round((d.match||70)*.6+(hit/Math.max(tags.length,1))*40),40,99);
}
function relativeTime(value){
  const t=value instanceof Date ? value.getTime() : new Date(value||0).getTime();
  if(!t) return '刚刚';
  const diff=Math.max(0,Date.now()-t), min=Math.floor(diff/60000), hour=Math.floor(min/60), day=Math.floor(hour/24);
  if(min<1) return '刚刚';
  if(min<60) return min+'分钟前';
  if(hour<24) return hour+'小时前';
  if(day<7) return day+'天前';
  return new Date(t).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'});
}

exports.main=async(e)=>{
  const me=openid();
  try{
    const page=Math.max(1,Number(e.page)||1);
    const posts=(await db.collection('posts').orderBy('createdAt','desc').skip((page-1)*MAX_PAGE).limit(MAX_PAGE).get()).data;
    if(!posts.length) return {success:true,data:[]};

    const userIds=[...new Set(posts.map(x=>x.openid).filter(Boolean))];
    const storeIds=[...new Set(posts.map(x=>Number(x.storeId)).filter(Boolean))];
    const [current,users,dishes,stores]=await Promise.all([
      db.collection('users').doc(me).get().catch(()=>({data:{}})),
      Promise.all(userIds.map(id=>db.collection('users').doc(id).get().then(r=>r.data||{}).catch(()=>({})))),
      db.collection('dishes').limit(100).get(),
      db.collection('stores').limit(100).get()
    ]);
    const meUser=current.data||{};
    const userMap=new Map(userIds.map((id,i)=>[id,users[i]]));
    const dishList=dishes.data||[];
    const storeList=stores.data||[];

    const data=posts.map(post=>{
      const author=userMap.get(post.openid)||{};
      const dish=dishList.find(x=>Number(x.id)===Number(post.dishId)) ||
        dishList.find(x=>x.name===post.name && (!post.store || x.store===post.store));
      const store=storeList.find(x=>Number(x.id)===Number(post.storeId));
      const dishId=dish?.id||Number(post.dishId)||0;
      const dishName=dish?.name||post.name||'这道美食';
      const storeName=post.store||dish?.store||store?.name||'本地好店';
      const authorName=author.name||'美食同好';
      const authorMatch=post.openid && post.openid!==me ? similarity(meUser,author) : dishMatch(dish||{},meUser.taste||[]);
      let text=post.note||'';
      if(!text){
        text=post.vote==='no'?'不太推荐「'+dishName+'」':post.vote==='conditional'?'觉得「'+dishName+'」有条件许吃':'刚刚许吃了「'+dishName+'」';
      }
      return {
        ...post,
        userName:authorName,
        avatar:author.avatar||'🍜',
        dishId,
        dishName,
        store:storeName,
        text,
        match:authorMatch,
        time:relativeTime(post.createdAt),
        tags:Array.isArray(post.tags)&&post.tags.length?post.tags.slice(0,6):(dish?.tags||[]).slice(0,6)
      };
    });
    return {success:true,data};
  }catch(err){
    return {success:false,message:err.message||'动态加载失败',data:[]};
  }
};
