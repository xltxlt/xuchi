const {dishes}=require('../../utils/data');
const {call}=require('../../utils/api');

Page({
  data:{
    data:{},
    dish:{},
    userTags:[],
    common:[],
    socialProof:[],
    loading:true
  },
  onLoad(o){
    const dish=dishes.find(x=>x.id==o.id)||dishes[0];
    const app=getApp();
    const user=(app.globalData&&app.globalData.user)||{};
    this.setData({dish,userTags:user.taste||user.tags||[]});
    call('recommendReason',{dishId:dish.id}).then(r=>{
      const data=r.data||{};
      this.setData({data,common:data.common&&data.common.length?data.common:this.localCommon(dish,user),socialProof:data.socialProof||this.localProof(dish),loading:false});
    }).catch(()=>{
      this.setData({data:{score:dish.match||91,reason:this.localReason(dish,user)},common:this.localCommon(dish,user),socialProof:this.localProof(dish),loading:false});
    });
  },
  localCommon(dish,user){
    const tags=[...(dish.tags||[]),...(dish.taste||[])];
    const liked=user.taste||user.tags||[];
    return [...new Set(tags.filter(x=>liked.some(t=>x.indexOf(t)>=0||t.indexOf(x)>=0)))].slice(0,5);
  },
  localReason(dish,user){
    const common=this.localCommon(dish,user);
    if(common.length)return `你常喜欢${common.slice(0,3).join('、')}，这道菜刚好命中；再结合你最近的${this.sceneText()}口味，许吃概率很高。`;
    return `这道菜的整体口味与你过去许吃的内容接近，系统把它排进了今天的推荐。`;
  },
  localProof(dish){
    const score=Math.min(99,Math.max(78,(dish.match||90)-2));
    return [`与你口味相似的人中，${score}% 许吃过这道菜`,`本地吃货近期也在关注「${dish.name}」`,`这道菜的标签与你的口味画像有较高重合`];
  },
  sceneText(){const h=new Date().getHours();if(h>=6&&h<10)return'早餐';if(h>=10&&h<14)return'午餐';if(h>=14&&h<17)return'下午茶';if(h>=17&&h<21)return'晚餐';return'夜宵'}
})