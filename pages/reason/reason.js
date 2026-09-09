const {call}=require('../../utils/api');Page({data:{data:{}},onLoad(o){call('recommendReason',{dishId:o.id}).then(r=>this.setData({data:r.data||{}}))}})
