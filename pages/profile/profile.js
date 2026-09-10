const {call}=require('../../utils/api');
Page({
 data:{user:{},loading:false},
 onLoad(){this.load()},
 onShow(){this.load()},
 async load(){
  const u=(getApp().globalData&&getApp().globalData.user)||{};
  const votes=wx.getStorageSync('dishVotes')||{};
  const localLikes=Object.keys(votes).filter(id=>votes[id]==='yes').length;
  const localHistory=wx.getStorageSync('eatHistory')||[];
  this.setData({loading:true});
  try{
   const r=await call('profile');
   const cloud=r&&r.data||{};
   this.setData({user:Object.assign({},u,cloud,{eatCount:Number(cloud.eatCount??cloud.eaten??localHistory.length),likeCount:Number(cloud.likes??cloud.likeCount??localLikes)})});
  }catch(e){
   this.setData({user:Object.assign({},u,{eatCount:localHistory.length,likeCount:localLikes})});
  }finally{this.setData({loading:false})}
 },
 openTaste(){wx.navigateTo({url:'/pages/taste/taste'})},
 openHistory(){wx.navigateTo({url:'/pages/eat-history/eat-history'})},
 openHobby(){wx.navigateTo({url:'/pages/hobby/hobby'})},
 openBadges(){wx.navigateTo({url:'/pages/badges/badges'})},
 openLike(){wx.navigateTo({url:'/pages/like/like'})}
})
