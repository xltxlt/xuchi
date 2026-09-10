const {call}=require('../../utils/api');

Page({
  data:{users:[],loading:true},
  onLoad(){this.load()},
  async load(){
    try{
      const r=await call('sameHobby');
      const users=(r.data||[]).map(x=>Object.assign({},x,{why:x.why||this.buildWhy(x)}));
      this.setData({users,loading:false});
    }catch(e){this.setData({users:[],loading:false})}
  },
  buildWhy(user){
    const common=user.common||[];
    if(common.length>=2)return `你们都喜欢${common.slice(0,2).join('、')}`;
    if(common.length===1)return `你们都喜欢${common[0]}`;
    return '你们的许吃记录和口味偏好很接近';
  },
  open(e){wx.navigateTo({url:'/pages/hobby-detail/hobby?id='+e.currentTarget.dataset.id})},
  follow(e){call('follow',{targetId:e.currentTarget.dataset.id}).then(()=>this.load()).catch(()=>{})}
})