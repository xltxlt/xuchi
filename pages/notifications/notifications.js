const {call}=require('../../utils/api');Page({data:{items:[]},onLoad(){call('notifications').then(r=>this.setData({items:r.data||[]}))}})
