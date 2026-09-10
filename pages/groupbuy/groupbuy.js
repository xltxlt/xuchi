Page({
  data:{groups:[],loading:false,title:'',dishName:'',storeName:'',price:'',unit:'份',endAt:''},
  onShow(){this.load()},
  async load(){this.setData({loading:true});try{const r=await wx.cloud.callFunction({name:'groupbuy',data:{action:'list'}});this.setData({groups:r.result?.data||[]})}finally{this.setData({loading:false})}},
  input(e){this.setData({[e.currentTarget.dataset.key]:e.detail.value})},
  create(){const d=this.data;if(!d.title.trim())return wx.showToast({title:'先写个团购名称',icon:'none'});wx.cloud.callFunction({name:'groupbuy',data:{action:'create',title:d.title,dishName:d.dishName,storeName:d.storeName,price:Number(d.price)||0,unit:d.unit,endAt:d.endAt}}).then(r=>{if(!r.result?.success)return wx.showToast({title:r.result?.message||'创建失败',icon:'none'});wx.showToast({title:'团购已创建'});this.setData({title:'',dishName:'',storeName:'',price:'',endAt:''});this.load()})},
  open(e){wx.navigateTo({url:'/pages/groupbuy-detail/groupbuy-detail?id='+e.currentTarget.dataset.id})},
  onPullDownRefresh(){this.load().finally(()=>wx.stopPullDownRefresh())}
})