const {dishes,stores}=require('../../utils/data');
const {scoreDish}=require('../../utils/recommend');
const {call}=require('../../utils/api');

Page({
  data:{keyword:'',tab:'dish',results:[],hot:['牛肉面','夜宵','烧烤','甜品','酸辣粉'],loading:false},
  onLoad(o){if(o.keyword)this.setData({keyword:o.keyword},()=>this.search())},
  onInput(e){this.setData({keyword:e.detail.value})},
  setTab(e){this.setData({tab:e.currentTarget.dataset.tab},()=>this.search())},
  async search(){
    const k=(this.data.keyword||'').trim();
    if(!k){this.setData({results:[]});return}
    this.setData({loading:true});
    try{
      const r=await call('search',{keyword:k});
      const cloudList=this.data.tab==='store'?(r&&r.data&&r.data.stores):(r&&r.data&&r.data.dishes);
      if(r&&r.success!==false&&Array.isArray(cloudList)&&cloudList.length){
        const user=getApp().globalData.user;
        this.setData({results:this.data.tab==='dish'?cloudList.map(x=>({...x,match:Math.max(x.match||0,scoreDish(x,user))})):cloudList});
        return;
      }
    }catch(e){}
    const list=this.data.tab==='store'?stores:dishes,user=getApp().globalData.user;
    this.setData({results:list.filter(x=>`${x.name}${x.store||''}${(x.tags||[]).join('')}`.includes(k)).map(x=>this.data.tab==='dish'?{...x,match:Math.max(x.match||0,scoreDish(x,user))}:x)});
    this.setData({loading:false});
  },
  hotSearch(e){this.setData({keyword:e.currentTarget.dataset.k},()=>this.search())},
  openDish(e){wx.navigateTo({url:'/pages/dish/dish?id='+e.currentTarget.dataset.id})},
  openStore(e){wx.navigateTo({url:'/pages/store/store?id='+e.currentTarget.dataset.id})}
});