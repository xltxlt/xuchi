const {dishes}=require('../../utils/data');
const {call}=require('../../utils/api');
function todaySeed(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
function getLiked(){const votes=wx.getStorageSync('dishVotes')||{};return Object.keys(votes).filter(id=>votes[id]==='yes').map(Number)}
function recommendV2(scene){
 if(wx.cloud&&wx.cloud.callFunction)return wx.cloud.callFunction({name:'recommendV2',data:{scene,limit:6}}).then(r=>r&&r.result||{});
 return Promise.reject(new Error('cloud unavailable'));
}
Page({
 data:{user:{name:'小许',tags:['重口玩家','碳水脑袋'],match:91},greeting:'今天想吃什么？',picks:[],recent:[],decision:null,refreshing:false,deciding:false},
 onLoad(){this.load()},onShow(){this.loadRecent()},
 onPullDownRefresh(){this.setData({refreshing:true});this.load().finally(()=>{this.setData({refreshing:false});wx.stopPullDownRefresh()})},
 load(){const app=getApp();const user=(app.globalData&&app.globalData.user)||this.data.user;this.setData({user},()=>this.loadRecent());const scene=this.sceneText();return recommendV2(scene).catch(()=>call('recommend',{limit:6,scene},{cache:true})).then(r=>{const list=(r&&r.data&&r.data.dishes)||r.data||[];const picks=this.pickLocal(list&&list.length?list:dishes);this.setData({picks});this.buildDecision(picks)}).catch(()=>{const picks=this.pickLocal(dishes);this.setData({picks});this.buildDecision(picks)})},
 sceneText(){const h=new Date().getHours();if(h>=6&&h<10)return'早餐';if(h>=10&&h<14)return'午餐';if(h>=14&&h<17)return'下午茶';if(h>=17&&h<21)return'晚餐';return'夜宵'},
 pickLocal(list){const liked=getLiked();const seed=todaySeed();return list.map((x,i)=>Object.assign({},x,{reason:x.reason|| (i===0?'最懂你的口味':(liked.indexOf(Number(x.id))>=0?'你许吃过，值得再来':'与你的口味匹配'))})).sort((a,b)=>((b.match||0)-(a.match||0)+(a.id*seed%7-b.id*seed%7))).slice(0,3)},
 buildDecision(picks){const history=wx.getStorageSync('eatHistory')||[];const eaten=history.map(x=>Number(x.id));const liked=getLiked();const scene=this.sceneText();const scored=(picks||dishes).map(x=>{const sceneTags={早餐:['早餐','面食'],午餐:['午餐','米饭','面食'],下午茶:['下午茶','甜品'],晚餐:['晚餐','烧烤','火锅'],夜宵:['夜宵','烧烤','小吃']}[scene]||[];const hit=(x.tags||[]).filter(t=>sceneTags.indexOf(t)>=0).length;const score=(x.match||85)+hit*4+(liked.indexOf(Number(x.id))>=0?8:0)-(eaten.indexOf(Number(x.id))>=0?7:0);return Object.assign({},x,{decisionScore:score})}).sort((a,b)=>b.decisionScore-a.decisionScore);const d=scored[0]||dishes[0];this.setData({decision:d})},
 decideForMe(){if(this.data.deciding)return;const target=this.data.decision||this.data.picks[0]||dishes[0];this.setData({deciding:true});const log=wx.getStorageSync('decisionHistory')||[];log.unshift({id:target.id,name:target.name,time:Date.now()});wx.setStorageSync('decisionHistory',log.slice(0,20));setTimeout(()=>{this.setData({deciding:false});wx.navigateTo({url:'/pages/dish/dish?id='+target.id})},220)},
 openDish(e){wx.navigateTo({url:'/pages/dish/dish?id='+e.currentTarget.dataset.id})},openHistory(){wx.navigateTo({url:'/pages/eat-history/eat-history'})},openNearby(){wx.switchTab({url:'/pages/nearby/nearby'})},openDiscover(){wx.switchTab({url:'/pages/discover/discover'})},openTaste(){wx.navigateTo({url:'/pages/taste/taste'})},shuffle(){const picks=this.pickLocal([...dishes].sort(()=>Math.random()-.5));this.setData({picks});this.buildDecision(picks)}})