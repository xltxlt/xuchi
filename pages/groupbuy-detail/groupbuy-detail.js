Page({
 data:{group:null,qty:1,name:'',note:'',totalAmount:0,isOwner:false},
 onLoad(o){this.id=o.id;this.load()},
 load(){wx.cloud.callFunction({name:'groupbuy',data:{action:'detail',id:this.id}}).then(r=>{const d=r.result&&r.result.data;if(!d)return wx.showToast({title:(r.result&&r.result.message)||'加载失败',icon:'none'});this.setData({group:d,name:d.mine&&d.mine.name||'',qty:d.mine&&d.mine.qty||1,note:d.mine&&d.mine.note||'',totalAmount:(d.price||0)*(d.totalQty||0),isOwner:d.creatorId===(d.mine&&d.mine.openid)})})},
 input(e){this.setData({[e.currentTarget.dataset.key]:e.detail.value})},
 changeQty(e){this.setData({qty:Math.max(1,Math.min(999,Number(e.detail.value)||1))})},
 join(){wx.cloud.callFunction({name:'groupbuy',data:{action:'join',id:this.id,qty:Number(this.data.qty),name:this.data.name,note:this.data.note}}).then(r=>{if(!(r.result&&r.result.success))return wx.showToast({title:(r.result&&r.result.message)||'提交失败',icon:'none'});wx.showToast({title:'已更新数量'});this.load()})},
 leave(){wx.showModal({title:'退出团购',content:'确认移除你的购买数量？',success:r=>{if(r.confirm)wx.cloud.callFunction({name:'groupbuy',data:{action:'leave',id:this.id}}).then(()=>this.load())}})},
 close(){wx.showModal({title:'结束团购',content:'结束后成员不能继续修改数量，确认结束？',success:r=>{if(r.confirm)wx.cloud.callFunction({name:'groupbuy',data:{action:'close',id:this.id}}).then(x=>{if(x.result&&x.result.success)this.load()})}})},
 share(){
   const g=this.data.group||{};
   wx.showShareMenu({withShareTicket:true});
   return {title:`${g.title||'团购'}｜${g.dishName||''} ¥${g.price||0}/${g.unit||'份'}`,path:`/pages/groupbuy-detail/groupbuy-detail?id=${this.id}`};
 },
 onShareAppMessage(){return this.share()}
})