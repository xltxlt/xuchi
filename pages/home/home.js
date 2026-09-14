const {dishes}=require('../../utils/data');
const {call}=require('../../utils/api');
function track(dishId,type,source,scene,position){if(!dishId)return;call('recommendEvent',{dishId,type,source,scene,position},{cache:false}).catch(()=>{})}
function recommendV2(scene){
 if(wx.cloud&&wx.cloud.callFunction)return wx.cloud.callFunction({name:'recommendV2',data:{scene,limit:6}}).then(r=>r&&r.result||{});
 return Promise.reject(new Error('cloud unavailable'));
}
Page({
 data:{user:{name:'小许',tags:['重口玩家','碳水脑袋'],match:91},greeting:'今天想吃什么？',picks:[],recent:[],decision:null,refreshing:false,deciding:false},
 onLoad(){this.load()},onShow(){this.loadRecent()},
 onPullDownRefresh(){this.setData({refreshing:true});this.load().finally(()=>{this.setData({refreshing:false});wx.stopPullDownRefresh()})},
 load(){const app=getApp();const user=(app.globalData&&app.globalData.user)||this.data.user;this.setData({user},()=>this.loadRecent());const scene=this.sceneText();return recommendV2(scene).catch(()=>call('recommend',{limit:6,scene},{cache:true})).then(r=>{const list=(r&&r.data&&r.data.dishes)||r.data||[];const picks=(Array.isArray(list)&&list.length?list:dishes).slice(0,3);this.setData({picks,decision:picks[0]||null},()=>this.trackPicks(scene,'recommend'));}).catch(()=>{const picks=dishes.slice(0,3);this.setData({picks,decision:picks[0]||null})})},
 trackPicks(scene,source){(this.data.picks||[]).forEach((x,i)=>track(x.id,'exposure',source,scene,i+1))},
 sceneText(){const h=new Date().getHours();if(h>=6&&h<10)return'早餐';if(h>=10&&h<14)return'午餐';if(h>=14&&h<17)return'下午茶';if(h>=17&&h<21)return'晚餐';return'夜宵'},
 decideForMe(){if(this.data.deciding)return;const target=this.data.decision||this.data.picks[0]||dishes[0];track(target.id,'decision','home_decision',this.sceneText(),this.data.picks.findIndex(x=>x.id===target.id)+1);this.setData({deciding:true});const log=wx.getStorageSync('decisionHistory')||[];log.unshift({id:target.id,name:target.name,time:Date.now()});wx.setStorageSync('decisionHistory',log.slice(0,20));setTimeout(()=>{this.setData({deciding:false});wx.navigateTo({url:'/pages/dish/dish?id='+target.id})},220)},
 openDish(e){const id=e.currentTarget.dataset.id;track(id,'click','home_recommend',this.sceneText(),this.data.picks.findIndex(x=>x.id==id)+1);wx.navigateTo({url:'/pages/dish/dish?id='+e.currentTarget.dataset.id})},openHistory(){wx.navigateTo({url:'/pages/eat-history/eat-history'})},openNearby(){wx.switchTab({url:'/pages/nearby/nearby'})},openDiscover(){wx.switchTab({url:'/pages/discover/discover'})},openTaste(){wx.navigateTo({url:'/pages/taste/taste'})},shuffle(){if(this.data.deciding)return;const scene=this.sceneText();this.setData({deciding:true});recommendV2(scene).then(r=>{const list=(r&&r.data&&r.data.dishes)||r.data||[];const picks=Array.isArray(list)&&list.length?list.slice(0,3):this.data.picks;this.setData({picks,decision:picks[0]||null},()=>this.trackPicks(scene,'shuffle')).catch(()=>{}).finally(()=>this.setData({deciding:false}))}})