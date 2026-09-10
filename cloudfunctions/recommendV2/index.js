const cloud=require('wx-server-sdk');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
const db=cloud.database();
const MAX=100;
const WEIGHTS={yes:1,conditional:0.25,no:-1,eat:1.15,eatAgain:1.35,favorite:1.2};
function clamp(n,a=20,b=99){return Math.max(a,Math.min(b,n))}
function arr(v){return Array.isArray(v)?v:[]}
function tagsOf(d){return arr(d&&d.tags)}
function overlap(a,b){const s=new Set(arr(a));return arr(b).filter(x=>s.has(x))}
function ageDays(v){if(!v)return 999;const t=v instanceof Date?v.getTime():new Date(v).getTime();return Number.isFinite(t)?Math.max(0,(Date.now()-t)/86400000):999}
function decay(v){const d=ageDays(v);return d>=60?0.25:Math.exp(-d/30)}
function reason(tags,positive,negative,community,scene){
 const common=overlap(tags,positive).slice(0,3);
 if(common.length)return '因为你喜欢'+common.join('、');
 const safe=tags.filter(x=>!negative.has(x)).slice(0,2);
 if(scene&&safe.length)return '符合你最近的'+scene+'口味';
 if(community>=75)return '与你口味相似的人大多许吃';
 return '根据你的许吃记录为你挑选';
}
exports.main=async(e)=>{
 const me=cloud.getWXContext().OPENID;
 try{
  const u=(await db.collection('users').doc(me).get().catch(()=>({data:{}}))).data||{};
  const taste=[...new Set([...arr(u.taste),...arr(u.tags)])];
  const [dishesRes,actionsRes,eatRes,favRes,allActionsRes]=await Promise.all([
   db.collection('dishes').limit(MAX).get(),
   db.collection('user_actions').where({openid:me}).limit(1000).get(),
   db.collection('eat_records').where({openid:me}).limit(1000).get(),
   db.collection('favorites').where({openid:me}).limit(1000).get(),
   db.collection('user_actions').limit(2000).get()
  ]);
  const dishes=dishesRes.data||[], actions=actionsRes.data||[], eats=eatRes.data||[], favs=favRes.data||[], community=allActionsRes.data||[];
  const favoriteIds=new Set(favs.map(x=>Number(x.dishId)));
  const eatMap=new Map();eats.forEach(x=>{const id=Number(x.dishId);const old=eatMap.get(id);if(!old||ageDays(x.createdAt)<ageDays(old.createdAt))eatMap.set(id,x)});
  const actionMap=new Map(actions.filter(x=>['yes','conditional','no'].includes(x.type)).map(x=>[Number(x.dishId),x]));
  const tagAffinity=new Map(),negativeTags=new Set();
  function addAffinity(tags,weight){tags.forEach(t=>tagAffinity.set(t,(tagAffinity.get(t)||0)+weight))}
  actions.forEach(a=>{const d=dishes.find(x=>Number(x.id)===Number(a.dishId)),tags=tagsOf(d).length?tagsOf(d):arr(a.tags);const w=(WEIGHTS[a.type]||0)*decay(a.updatedAt||a.createdAt);if(w)addAffinity(tags,w);if(a.type==='no')tags.forEach(t=>negativeTags.add(t))});
  eats.forEach(a=>{const d=dishes.find(x=>Number(x.id)===Number(a.dishId));addAffinity(tagsOf(d),(WEIGHTS[a.type]||1)*decay(a.createdAt))});
  favs.forEach(a=>{const d=dishes.find(x=>Number(x.id)===Number(a.dishId));addAffinity(tagsOf(d),WEIGHTS.favorite*decay(a.createdAt))});
  const communityByDish=new Map();community.forEach(a=>{if(!['yes','conditional','no'].includes(a.type))return;const id=Number(a.dishId),x=communityByDish.get(id)||{yes:0,conditional:0,no:0};x[a.type]++;communityByDish.set(id,x)});
  const scene=String(e.scene||'');
  const sceneTags={早餐:['早餐','面食'],午餐:['午餐','米饭','面食'],下午茶:['下午茶','甜品'],晚餐:['晚餐','烧烤','火锅'],夜宵:['夜宵','烧烤','小吃']}[scene]||[];
  const ranked=dishes.map(d=>{
   const tags=tagsOf(d),direct=overlap(taste,tags).length,aff=tags.reduce((s,t)=>s+(tagAffinity.get(t)||0),0),affNorm=aff/(Math.max(1,tags.length)*1.5),sceneHit=overlap(sceneTags,tags).length,counts=communityByDish.get(Number(d.id))||{yes:0,conditional:0,no:0},total=counts.yes+counts.conditional+counts.no,communityRate=total?Math.round(counts.yes/total*100):0,reaction=actionMap.get(Number(d.id)),eaten=eatMap.has(Number(d.id)),favorite=favoriteIds.has(Number(d.id));
   const profileScore=Math.min(100,direct/Math.max(1,taste.length)*100);
   const behaviorScore=clamp(50+affNorm*18,20,99);
   const communityScore=communityRate||70;
   const base=Number(d.match)||70;
   let final=base*.2+profileScore*.35+behaviorScore*.25+communityScore*.15+sceneHit*5*.05;
   if(reaction)final+=reaction.type==='yes'?8:reaction.type==='conditional'?-3:-35;
   if(eaten)final-=4;
   if(favorite)final+=6;
   const isExplored=!!reaction||eaten||favorite;
   return{...d,match:clamp(Math.round(final)),reason:reason(tags,taste,negativeTags,communityScore,scene),signals:{taste:direct,behavior:Math.round(behaviorScore),community:communityRate,scene:sceneHit,eaten,favorite,reaction:reaction?.type||'none'},_explored:isExplored};
  }).filter(x=>!(x.signals.reaction==='no'));
  ranked.sort((a,b)=>b.match-a.match||Number(b.likes||0)-Number(a.likes||0));
  const fresh=ranked.filter(x=>!x._explored),explored=ranked.filter(x=>x._explored);
  const result=[...fresh,...explored].slice(0,10).map(x=>{const y={...x};delete y._explored;return y});
  return{success:true,data:result,profile:{taste:taste.slice(0,30),signals:actions.length+eats.length+favs.length,learnedTags:[...tagAffinity.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0])}};
 }catch(err){console.error(err);return{success:false,message:'推荐服务暂不可用',error:err.message}};
};
