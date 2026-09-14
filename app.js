const { call } = require('./utils/api');
const config = require('./config');

App({
  globalData:{
    user:null,
    ready:false,
    config
  },
  onLaunch(){
    if(!wx.cloud){
      wx.showModal({title:'许吃',content:'当前微信版本不支持云开发，请升级微信后重试。',showCancel:false});
      return;
    }
    if(!config.envId || config.envId === 'YOUR_ENV_ID'){
      console.error('[xuchi] 请先在 config.js 配置正式云开发环境 ID');
      wx.showModal({title:'许吃尚未配置完成',content:'请在项目根目录 config.js 中配置正式云开发环境 ID。',showCancel:false});
      return;
    }
    wx.cloud.init({env:config.envId,traceUser:true});
    call('login').then(r=>{
      if(!r || !r.success) throw new Error(r?.message||'登录初始化失败');
      this.globalData.user=r.data||null;
      this.globalData.ready=true;
    }).catch(err=>{
      console.error('[xuchi] login failed',err);
      wx.showToast({title:'网络异常，请稍后重试',icon:'none'});
    });
  }
});
