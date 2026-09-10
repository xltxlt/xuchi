const {call}=require('../../utils/api');
Page({
 data:{user:{},similarityReasons:[],sharedDishes:[]},
 onLoad(o){this.id=o.id;this.load()},
 async load(){try{const r=await call('hobbyDetail',{userId:this.id});const user=r.data||{};this.setData({user,similarityReasons:user.reasons||this.buildReasons(user),sharedDishes:user.sharedDishes||[]})}catch(e){this.setData({user:{}})}},
 buildReasons(user){const common=user.common||[];const reasons=[];if(common.length)reasons.push(`共同喜欢：${common.slice(0,4).join('、')}`);if(user.similarity)reasons.push(`口味画像相似度达到 ${user.similarity}%`);if((user.taste||[]).length)reasons.push(`TA最近常吃：${user.taste.slice(0,3).join('、')}`);return reasons},
 follow(){const old=!!this.data.user.following;this.setData({user:Object.assign({},this.data.user,{following:!old})});call('follow',{targetId:this.id}).then(r=>{if(r&&r.success===false)throw new Error(r.message||'操作失败');this.setData({user:Object.assign({},this.data.user,{following:!!r.following})});wx.showToast({title:r.following?'已关注':'已取消关注',icon:'success'})}).catch(()=>{this.setData({user:Object.assign({},this.data.user,{following:old})});wx.showToast({title:'操作失败，请稍后再试',icon:'none'})})},
 openDish(e){wx.navigateTo({url:'/pages/dish/dish?id='+e.currentTarget.dataset.id})}
})