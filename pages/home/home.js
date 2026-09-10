const {dishes}=require('../../utils/data');
const {call}=require('../../utils/api');
function todaySeed(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+ d.getDate()}
Page({
  data:{user:{name:'小许',tags:['重口玩家','碳水脑袋'],match:91},greeting:'今天想吃什么？',picks:[],recent:[],refreshing:false,deciding:false},
  onLoad(){this.load()},onShow(){this.loadRecent()},
  onPullDownRefresh(){this.setData({refreshing:true});this.load().finally(()=>{this.setData({refreshing:false});wx.stopPullDownRefresh()})},
  load(){const app=getApp();const user=(app.globalData&&app.globalData.user)||this.data.user;this.setData({user},()=>this.loadRecent());return call('recommend',{limit:6,scene:this.sceneText()},{cache:true}).then(r=>{const list=(r&&r.data&&r.data.dishes)||r.data||[];this.setData({picks:this.pickLocal(list&&list.length?list:dishes)})}).catch(()=>{this.setData({picks:this.pickLocal(dishes)})})},
  sceneText(){const h=new Date().getHours();if(h>=6&&h<10)return'早餐';if(h>=10&&h<14)return'午餐';if(h>=14&&h<17)return'下午茶';if(h>=17&&h<21)return'晚餐';return'夜宵'},
  pickLocal(list){const liked=wx.getStorageSync('likedDishes')||[];const seed=todaySeed();return list.map((x,i)=>Object.assign({},x,{reason:i===0?'最懂你的口味':(liked.indexOf(x.id)>=0?'你许吃过，值得再来':'与你的口味匹配')})).sort((a,b)=>((b.match||0)-(a.match||0)+(a.id*seed%7-b.id*seed%7))).slice(0,3)},
  loadRecent(){const history=wx.getStorageSync('eatHistory')||[];this.setData({recent:history.slice(0,3)})},
  decideForMe(){if(this.data.deciding)return;this.setData({deciding:true});const pool=this.data.picks.length?this.data.picks:dishes;const liked=wx.getStorageSync('likedDishes')||[];const ranked=[...pool].sort((a,b)=>((b.match||0)+(liked.includes(b.id)?12:0))-((a.match||0)+(liked.includes(a.id)?12:0)));const target=ranked[0]||dishes[0];const log=wx.getStorageSync('decisionHistory')||[];log.unshift({id:target.id,name:target.name,time:Date.now()});wx.setStorageSync('decisionHistory',log.slice(0,20));setTimeout(()=>{this.setData({deciding:false});wx.navigateTo({url:'/pages/dish/dish?id='+target.id})},220)},
  openDish(e){wx.navigateTo({url:'/pages/dish/dish?id='+e.currentTarget.dataset.id})},openHistory(){wx.navigateTo({url:'/pages/eat-history/eat-history'})},openNearby(){wx.switchTab({url:'/pages/nearby/nearby'})},openDiscover(){wx.switchTab({url:'/pages/discover/discover'})},openTaste(){wx.navigateTo({url:'/pages/taste/taste'})},shuffle(){this.setData({picks:this.pickLocal([...dishes].sort(()=>Math.random()-.5))})}
})