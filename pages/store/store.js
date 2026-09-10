const {dishes,stores}=require('../../utils/data');
const {call}=require('../../utils/api');

Page({
  data:{store:{},dishes:[],loading:false},
  async onLoad(o){
    const id=Number(o.id);
    const localStore=stores.find(x=>x.id==id)||stores[0];
    this.setData({store:localStore,dishes:dishes.filter(d=>d.storeId===localStore.id),loading:true});
    try{
      const r=await call('getStores');
      const cloudStores=Array.isArray(r&&r.data)?r.data:[];
      const store=cloudStores.find(x=>Number(x.id)===id)||cloudStores.find(x=>Number(x._id)===id);
      if(store){
        const dr=await call('getDishes',{storeId:Number(store.id)});
        const cloudDishes=Array.isArray(dr&&dr.data)?dr.data:[];
        this.setData({store,dishes:cloudDishes.length?cloudDishes:dishes.filter(d=>d.storeId===Number(store.id))});
      }
    }catch(e){}
    this.setData({loading:false});
  },
  openDish(e){wx.navigateTo({url:'/pages/dish/dish?id='+e.currentTarget.dataset.id})}
})