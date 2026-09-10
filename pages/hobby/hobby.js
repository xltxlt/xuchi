const {call}=require('../../utils/api');
Page({
 data:{users:[],loading:true},
 onLoad(){this.load()},
 async load(){try{const r=await call('sameHobby');const users=(r.data||[]).map(x=>Object.assign({},x,{why:x.why||this.buildWhy(x)}));this.setData({users,loading:false})}catch(e){this.setData({users:[],loading:false})}},
 buildWhy(user){const common=user.common||[];if(common.length>=2)return `你们都喜欢${common.slice(0,2).join('、')}`;if(common.length===1)return `你们都喜欢${common[0]}`;return '你们的许吃记录和口味偏好很接近'},
 open(e){wx.navigateTo({url:'/pages/hobby-detail/hobby?id='+e.currentTarget.dataset.id})},
 follow(e){const id=e.currentTarget.dataset.id,users=this.data.users.map(x=>x._id===id?Object.assign({},x,{following:!x.following}):x);this.setData({users});call('follow',{targetId:id}).then(r=>{if(r&&r.success===false)throw new Error(r.message||'操作失败');this.setData({users:this.data.users.map(x=>x._id===id?Object.assign({},x,{following:r.following}):x)})}).catch(()=>{this.setData({users:this.data.users.map(x=>x._id===id?Object.assign({},x,{following:!x.following}):x)});wx.showToast({title:'操作失败，请稍后再试',icon:'none'})})}
})