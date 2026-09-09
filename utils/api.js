function call(action,data={}){if(!wx.cloud||!wx.cloud.callFunction)return Promise.resolve({data:{success:true,mock:true}});return wx.cloud.callFunction({name:'api',data:{action,...data}}).then(r=>r.result||r)}
module.exports={call};
