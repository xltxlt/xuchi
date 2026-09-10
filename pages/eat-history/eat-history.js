const {dishes}=require('../../utils/data');
Page({
 data:{items:[]},
 onShow(){this.load()},
 load(){const raw=wx.getStorageSync('eatHistory')||[];this.setData({items:raw.map(x=>Object.assign({},x,{date:this.format(x.time)}))})},
 format(t){if(!t)return'';const d=new Date(t),now=new Date();if(d.toDateString()===now.toDateString())return'今天';const y=d.getFullYear(),m=('0'+(d.getMonth()+1)).slice(-2),day=('0'+d.getDate()).slice(-2);return y===now.getFullYear()?m+'月'+day+'日':y+'年'+m+'月'+day+'日'},
 openDish(e){wx.navigateTo({url:'/pages/dish/dish?id='+e.currentTarget.dataset.id})},
 clear(){wx.showModal({title:'清空吃过记录？',content:'清空后，许吃不会再用这些记录辅助推荐。',confirmText:'清空',success:r=>{if(r.confirm){wx.removeStorageSync('eatHistory');this.load()}}})}
})