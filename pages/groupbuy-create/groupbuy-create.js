Page({
  data:{
    title:'',
    dishId:'',
    dishName:'',
    storeId:'',
    storeName:'',
    price:'',
    unit:'份',
    endAt:'',
    endDate:'',
    endTime:'',
    creating:false
  },
  onLoad(o){
    const price=o.price ? Number(o.price) : 0;
    const end=new Date(Date.now()+24*60*60*1000);
    const pad=n=>String(n).padStart(2,'0');
    this.setData({
      title:(o.dishName||'')+'团购',
      dishId:o.dishId||'',
      dishName:o.dishName||'',
      storeId:o.storeId||'',
      storeName:o.storeName||'',
      price:price||'',
      unit:o.unit||'份',
      endDate:`${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}`,
      endTime:`${pad(end.getHours())}:${pad(end.getMinutes())}`,
      endAt:end.toISOString()
    });
  },
  input(e){this.setData({[e.currentTarget.dataset.key]:e.detail.value})},
  pickDate(e){
    const date=e.detail.value;
    this.setData({endDate:date,endAt:`${date}T${this.data.endTime||'23:59'}:00`});
  },
  pickTime(e){
    const time=e.detail.value;
    this.setData({endTime:time,endAt:`${this.data.endDate}T${time}:00`});
  },
  create(){
    const d=this.data;
    if(!d.dishName)return wx.showToast({title:'缺少菜品信息',icon:'none'});
    if(!d.title.trim())return wx.showToast({title:'先写个团购名称',icon:'none'});
    if(!d.endDate||!d.endTime)return wx.showToast({title:'请选择截止时间',icon:'none'});
    this.setData({creating:true});
    wx.cloud.callFunction({name:'groupbuy',data:{
      action:'create',
      title:d.title.trim(),
      dishId:Number(d.dishId)||0,
      dishName:d.dishName,
      storeId:Number(d.storeId)||0,
      storeName:d.storeName,
      price:Number(d.price)||0,
      unit:d.unit||'份',
      endAt:`${d.endDate}T${d.endTime}:00`,
      creatorName:(getApp().globalData.user&&getApp().globalData.user.name)||'发起人'
    }}).then(r=>{
      if(!(r.result&&r.result.success))return wx.showToast({title:(r.result&&r.result.message)||'创建失败',icon:'none'});
      wx.redirectTo({url:'/pages/groupbuy-detail/groupbuy-detail?id='+r.result.id});
    }).catch(()=>wx.showToast({title:'创建失败，请稍后重试',icon:'none'})).finally(()=>this.setData({creating:false}));
  }
})
