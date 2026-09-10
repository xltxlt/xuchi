const {dishes}=require('../../utils/data'); const {call}=require('../../utils/api');
Page({
  data:{dish:dishes[0],liked:false,favorited:false,comments:[],comment:'',replyTo:''},
  onLoad(o){const d=dishes.find(x=>x.id==o.id)||dishes[0];this.setData({dish:d,liked:(wx.getStorageSync('likedDishes')||[]).includes(d.id)});this.loadComments()},
  loadComments(){call('comments',{dishId:this.data.dish.id,page:1}).then(r=>this.setData({comments:r.data||[]}))},
  toggleLike(){const id=this.data.dish.id,liked=this.data.liked;let a=wx.getStorageSync('likedDishes')||[];liked?a=a.filter(x=>x!==id):a.push(id);wx.setStorageSync('likedDishes',a);this.setData({liked:!liked});call('action',{dishId:id,type:liked?'none':'yes'})},
  favorite(){call('favorite',{dishId:this.data.dish.id}).then(r=>this.setData({favorited:r.favorited}))},
  onComment(e){this.setData({comment:e.detail.value})},
  reply(e){this.setData({replyTo:e.currentTarget.dataset.id});wx.showToast({title:'正在回复',icon:'none'})},
  submitComment(){const content=this.data.comment.trim();if(!content)return;call('comment',{dishId:this.data.dish.id,content,parentId:this.data.replyTo}).then(()=>{this.setData({comment:'',replyTo:''});this.loadComments();wx.showToast({title:'评论成功',icon:'success'})})},
  likeComment(e){call('commentLike',{commentId:e.currentTarget.dataset.id}).then(()=>this.loadComments())},
  share(){wx.showToast({title:'已生成同好分享卡',icon:'success'})},
  openReason(){wx.navigateTo({url:'/pages/reason/reason?id='+this.data.dish.id})},
  openStore(){wx.navigateTo({url:'/pages/store/store?id='+(this.data.dish.storeId||101)})},
  startGroupBuy(){
    const d=this.data.dish;
    wx.navigateTo({url:'/pages/groupbuy-create/groupbuy-create?'+[
      'dishId='+encodeURIComponent(d.id||''),
      'dishName='+encodeURIComponent(d.name||''),
      'storeId='+encodeURIComponent(d.storeId||''),
      'storeName='+encodeURIComponent(d.store||''),
      'price='+encodeURIComponent(d.price||0),
      'unit='+encodeURIComponent(d.unit||'份')
    ].join('&')});
  }
})