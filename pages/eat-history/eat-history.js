const {call}=require('../../utils/api');
Page({
 data:{items:[],loading:false,clearing:false},
 onShow(){this.load()},
 async load(){
  const local=wx.getStorageSync('eatHistory')||[];
  this.setData({loading:true});
  try{
   const r=await call('eatHistory',{page:1});
   if(r&&r.success===false)throw new Error(r.message||'加载失败');
   const cloud=Array.isArray(r&&r.data)?r.data:[];
   const map=new Map();
   local.forEach(x=>map.set(String(x.id),x));
   cloud.forEach(x=>{const old=map.get(String(x.id));map.set(String(x.id),Object.assign({},old||{},x,{time:this.toTime(x.createdAt)||old?.time||Date.now()}))});
   const items=[...map.values()].sort((a,b)=>this.toTime(b.time||b.createdAt)-this.toTime(a.time||a.createdAt)).slice(0,100).map(x=>Object.assign({},x,{date:this.format(x.time||x.createdAt)}));
   wx.setStorageSync('eatHistory',items);
   this.setData({items});
  }catch(e){this.setData({items:local.map(x=>Object.assign({},x,{date:this.format(x.time)}))})}
  finally{this.setData({loading:false})}
 },
 toTime(v){if(!v)return 0;if(typeof v==='number')return v;if(v instanceof Date)return v.getTime();if(v.$date)return new Date(v.$date).getTime();if(v._date)return new Date(v._date).getTime();const n=Date.parse(v);return Number.isNaN(n)?0:n},
 format(t){const n=this.toTime(t);if(!n)return'';const d=new Date(n),now=new Date();if(d.toDateString()===now.toDateString())return'今天';const y=d.getFullYear(),m=('0'+(d.getMonth()+1)).slice(-2),day=('0'+d.getDate()).slice(-2);return y===now.getFullYear()?m+'月'+day+'日':y+'年'+m+'月'+day+'日'},
 openDish(e){wx.navigateTo({url:'/pages/dish/dish?id='+e.currentTarget.dataset.id})},
 clear(){if(this.data.clearing)return;wx.showModal({title:'清空吃过记录？',content:'清空后，本地和云端的吃过记录都会删除。',confirmText:'清空',success:async r=>{if(!r.confirm)return;this.setData({clearing:true});try{const result=await call('clearEatHistory');if(result&&result.success===false)throw new Error(result.message||'清空失败');wx.removeStorageSync('eatHistory');this.setData({items:[]});wx.showToast({title:'已清空',icon:'success'})}catch(e){wx.showToast({title:'清空失败，请稍后再试',icon:'none'})}finally{this.setData({clearing:false})}}})}
})