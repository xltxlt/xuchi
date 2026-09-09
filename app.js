const { call } = require('./utils/api');
App({
  globalData:{user:{name:'小许',level:3,levelName:'好吃佬',avatar:'🍜',tags:['重口玩家','碳水脑袋','夜宵选手'],taste:['咸香','微辣','酥脆','牛肉','烧烤','夜宵'],likes:286,posts:18,match:91,hitRate:87}},
  onLaunch(){
    if(wx.cloud){wx.cloud.init({env:'YOUR_ENV_ID',traceUser:true});call('login').catch(()=>{});}
    if(!wx.getStorageSync('likedDishes'))wx.setStorageSync('likedDishes',[]);
  }
});
