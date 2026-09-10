const {dishes}=require('../../utils/data');
const {call}=require('../../utils/api');

Page({
 data:{dish:dishes[0],vote:'none',voteStats:{yes:0,conditional:0,no:0},voteCounts:{yes:0,conditional:0,no:0},favorited:false,comments:[],comment:'',replyTo:'',replyName:'',recorded:false,loading:false,reason:'',reasonTags:[],similarUsers:[],submitting:false},
 async onLoad(o){
  const id=Number(o.id),history=wx.getStorageSync('eatHistory')||[],votes=wx.getStorageSync('dishVotes')||[];
  const local=dishes.find(x=>x.id==id)||dishes[0];
  this.setData({dish:local,vote:votes[local.id]||'none',favorited:(wx.getStorageSync('favoriteDishes')||[]).includes(local.id),recorded:history.some(x=>x.id===local.id),loading:true});
  try{
   const r=await call('getDish',{dishId:id});
   if(r&&r.success!==false&&r.data){
    const d=r.data;
    this.setData({dish:d,vote:votes[d.id]||'none',favorited:(wx.getStorageSync('favoriteDishes')||[]).includes(d.id),recorded:history.some(x=>x.id===d.id)});
   }
  }catch(e){}
  this.setData({loading:false});
  this.loadStats();
  this.loadComments();
  this.loadReason();
  this.loadSimilar();
 },
 loadStats(){call('dishStats',{dishId:this.data.dish.id}).then(r=>{if(r&&r.data){const s=r.data;this.setData({vote:s.vote||this.data.vote,voteStats:s.stats||this.data.voteStats,voteCounts:s.counts||this.data.voteCounts});if(s.vote){const votes=wx.getStorageSync('dishVotes')||{};votes[this.data.dish.id]=s.vote;wx.setStorageSync('dishVotes',votes)}}}).catch(()=>{})},
 loadReason(){
  const d=this.data.dish,app=getApp(),u=(app.globalData&&app.globalData.user)||{},taste=[...(u.taste||[]),...(u.tags||[])],tags=d.tags||[],hit=[...new Set(tags.filter(t=>taste.some(x=>x===t||x.indexOf(t)>=0||t.indexOf(x)>=0)))].slice(0,4);
  const reason=hit.length?`因为你喜欢${hit.slice(0,3).join('、')}，这道菜刚好命中你的口味。`:`这道菜的整体口味与你过去许吃的内容接近，值得试一口。`;
  this.setData({reason,reasonTags:hit.length?hit:tags.slice(0,3)});
  call('recommendReason',{dishId:d.id}).then(r=>{if(r&&r.data){const x=r.data;this.setData({reason:x.reason||reason,reasonTags:x.common&&x.common.length?x.common.slice(0,4):this.data.reasonTags})}}).catch(()=>{});
 },
 loadSimilar(){
  call('sameHobby').then(r=>{const list=Array.isArray(r&&r.data)?r.data:[];this.setData({similarUsers:list.filter(x=>x&&x._id).slice(0,3)})}).catch(()=>{});
 },
 openHobby(e){const id=e.currentTarget.dataset.id;if(id)wx.navigateTo({url:'/pages/hobby-detail/hobby-detail?id='+encodeURIComponent(id)})},
 async loadComments(){try{const r=await call('comments',{dishId:this.data.dish.id,page:1}),roots=Array.isArray(r&&r.data)?r.data:[];const comments=await Promise.all(roots.map(async item=>{try{const rr=await call('comments',{dishId:this.data.dish.id,parentId:item._id,page:1});return Object.assign({},item,{replies:Array.isArray(rr&&rr.data)?rr.data:[]})}catch(e){return Object.assign({},item,{replies:[]})}}));this.setData({comments})}catch(e){this.setData({comments:[]})}},
 vote(e){const type=typeof e==='string'?e:e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.type;if(!['yes','conditional','no'].includes(type))return;const id=this.data.dish.id,old=this.data.vote,next=old===type?'none':type,votes=wx.getStorageSync('dishVotes')||{},stats=Object.assign({},this.data.voteStats),counts=Object.assign({},this.data.voteCounts);if(old&&old!=='none'){if(stats[old]>0)stats[old]--;if(counts[old]>0)counts[old]--}if(next!=='none'){stats[next]++;counts[next]++}votes[id]=next;wx.setStorageSync('dishVotes',votes);this.setData({vote:next,voteStats:stats,voteCounts:counts});call('action',{dishId:id,type:next}).then(r=>{if(r&&r.success===false)throw new Error(r.message||'操作失败');return call('dishStats',{dishId:id})}).then(r=>{if(r&&r.data){const v=wx.getStorageSync('dishVotes')||{};if(r.data.vote)v[id]=r.data.vote;else delete v[id];wx.setStorageSync('dishVotes',v);this.setData({vote:r.data.vote||'none',voteStats:r.data.stats||stats,voteCounts:r.data.counts||counts})}}).catch(()=>{const rollback=Object.assign({},this.data.voteStats),rollbackCounts=Object.assign({},this.data.voteCounts);if(next!=='none'){if(rollback[next]>0)rollback[next]--;if(rollbackCounts[next]>0)rollbackCounts[next]--}if(old&&old!=='none'){rollback[old]++;rollbackCounts[old]++}votes[id]=old;wx.setStorageSync('dishVotes',votes);this.setData({vote:old,voteStats:rollback,voteCounts:rollbackCounts});wx.showToast({title:'操作失败，请稍后再试',icon:'none'})})},
 toggleLike(){this.vote('yes')},
 favorite(){const id=this.data.dish.id,a=wx.getStorageSync('favoriteDishes')||[],on=a.includes(id),next=on?a.filter(x=>x!==id):a.concat(id);wx.setStorageSync('favoriteDishes',next);this.setData({favorited:!on});call('favorite',{dishId:id}).then(r=>{if(r&&r.success===false)throw new Error(r.message||'收藏失败')}).catch(()=>{wx.setStorageSync('favoriteDishes',a);this.setData({favorited:on});wx.showToast({title:'收藏失败，请稍后再试',icon:'none'})})},
 recordEat(){this.saveEat('eat','🍽️ 吃过','已记入吃过')},
 eatAgain(){this.saveEat('eatAgain','🔁 再吃一次','已记入今天')},
 saveEat(type,status,title){const d=this.data.dish;let history=wx.getStorageSync('eatHistory')||[];history=history.filter(x=>x.id!==d.id);history.unshift({id:d.id,name:d.name,store:d.store,emoji:d.emoji,status,time:Date.now()});wx.setStorageSync('eatHistory',history.slice(0,100));this.setData({recorded:true});wx.showToast({title,icon:'success'});call('action',{dishId:d.id,type}).then(r=>{if(r&&r.success===false)throw new Error(r.message||'记录失败')}).catch(()=>{})},
 onComment(e){this.setData({comment:e.detail.value})},
 reply(e){const id=e.currentTarget.dataset.id,name=e.currentTarget.dataset.name||'这位吃货';this.setData({replyTo:id,replyName:name});wx.showToast({title:'正在回复'+name,icon:'none'})},
 cancelReply(){this.setData({replyTo:'',replyName:''})},
 submitComment(){if(this.data.submitting)return;const content=this.data.comment.trim();if(!content)return wx.showToast({title:'评论不能为空',icon:'none'});if(content.length>200)return wx.showToast({title:'评论最多200字',icon:'none'});const bad=['赌博','诈骗','色情','辱骂'];if(bad.some(x=>content.includes(x)))return wx.showToast({title:'评论包含敏感内容',icon:'none'});this.setData({submitting:true});call('comment',{dishId:this.data.dish.id,content,parentId:this.data.replyTo}).then(r=>{if(r&&r.success===false)throw new Error(r.message||'评论失败');this.setData({comment:'',replyTo:'',replyName:''});this.loadComments();wx.showToast({title:'评论成功',icon:'success'})}).catch(e=>wx.showToast({title:e.message||'评论失败，请稍后再试',icon:'none'})).finally(()=>this.setData({submitting:false}))},
 likeComment(e){call('commentLike',{commentId:e.currentTarget.dataset.id}).then(()=>this.loadComments()).catch(()=>{})},
 share(){wx.showToast({title:'已生成同好分享卡',icon:'success'})},
 openReason(){wx.navigateTo({url:'/pages/reason/reason?id='+this.data.dish.id})},
 openStore(){wx.navigateTo({url:'/pages/store/store?id='+(this.data.dish.storeId||101)})},
 openHistory(){wx.navigateTo({url:'/pages/eat-history/eat-history'})},
 startGroupBuy(){const d=this.data.dish;wx.navigateTo({url:'/pages/groupbuy-create/groupbuy-create?'+['dishId='+encodeURIComponent(d.id||''),'dishName='+encodeURIComponent(d.name||''),'storeId='+encodeURIComponent(d.storeId||''),'storeName='+encodeURIComponent(d.store||''),'price='+encodeURIComponent(d.price||0),'unit='+encodeURIComponent(d.unit||'份')].join('&'))}
})