const {dishes}=require('../../utils/data');
const {call}=require('../../utils/api');

function loadFeed(page=1){
  if(wx.cloud&&wx.cloud.callFunction){
    return wx.cloud.callFunction({name:'feed',data:{page}}).then(r=>r&&r.result||{});
  }
  return call('feed',{page,pageSize:10},{cache:false});
}

Page({
  data:{feed:[],hotTags:['必点','性价比高','重口爱好者','隐藏宝藏','下午茶','夜宵'],loading:true},
  onLoad(){this.load()},
  onPullDownRefresh(){this.load().finally(()=>wx.stopPullDownRefresh())},
  load(){
    this.setData({loading:true});
    return loadFeed(1).then(r=>{
      const list=Array.isArray(r&&r.data)?r.data:[];
      this.setData({feed:list.length?list:this.localFeed(),loading:false});
    }).catch(()=>this.setData({feed:this.localFeed(),loading:false}));
  },
  localFeed(){
    return dishes.slice(0,5).map((d,i)=>({
      _id:'local-'+d.id,
      userName:['阿伟','小林','可乐','小周','小许'][i]||'美食同好',
      avatar:['🌶️','🍜','🍖','🍰','🍚'][i]||'🍜',
      text:i===0?'刚刚许吃了「'+d.name+'」':'推荐一道我觉得很稳的「'+d.name+'」',
      dishId:d.id,
      dishName:d.name,
      store:d.store,
      match:Math.max(82,(d.match||90)-i*2),
      tags:(d.tags||[]).slice(0,4),
      time:i+1+'小时前'
    }));
  },
  openDish(e){
    const id=e.currentTarget.dataset.id;
    if(!id)return wx.showToast({title:'菜品信息暂不可用',icon:'none'});
    wx.navigateTo({url:'/pages/dish/dish?id='+id});
  },
  openHobby(){wx.navigateTo({url:'/pages/hobby/hobby'})},
  chooseTag(e){
    const tag=e.currentTarget.dataset.tag;
    wx.navigateTo({url:'/pages/search/search?keyword='+encodeURIComponent(tag)});
  },
  publish(){wx.switchTab({url:'/pages/publish/publish'})}
});
