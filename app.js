const { call } = require('./utils/api');

App({
  globalData:{
    user:{name:'小许',level:3,levelName:'好吃佬',avatar:'🍜',tags:['重口玩家','碳水脑袋','夜宵选手'],taste:['咸香','微辣','酥脆','牛肉','烧烤','夜宵'],likes:286,posts:18,match:91,hitRate:87}
  },
  onLaunch(){
    if(wx.cloud){
      wx.cloud.init({env:'YOUR_ENV_ID',traceUser:true});
      call('login').then(r=>{
        const cloudUser=r&&r.data;
        if(!cloudUser)return;
        const user=Object.assign({},this.globalData.user,cloudUser);
        if(Array.isArray(cloudUser.taste))user.taste=cloudUser.taste;
        if(Array.isArray(cloudUser.tags))user.tags=cloudUser.tags;
        this.globalData.user=user;
      }).catch(()=>{});
    }
    if(!wx.getStorageSync('dishVotes'))wx.setStorageSync('dishVotes',{});
    if(!wx.getStorageSync('favoriteDishes'))wx.setStorageSync('favoriteDishes',[]);
    if(!wx.getStorageSync('eatHistory'))wx.setStorageSync('eatHistory',[]);
  }
});
