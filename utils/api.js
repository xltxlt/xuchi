const CACHE_TTL=60000;
function call(action,data={},options={}){const key=options.cache?`xuchi:${action}:${JSON.stringify(data)}`:'';if(key){const hit=wx.getStorageSync(key);if(hit&&Date.now()-hit.time<CACHE_TTL)return Promise.resolve(hit.value)}if(!wx.cloud||!wx.cloud.callFunction)return Promise.resolve({success:true,mock:true,data:{}});return wx.cloud.callFunction({name:'api',data:{action,...data}}).then(res=>{const value=res.result||res;if(key)wx.setStorageSync(key,{time:Date.now(),value});return value})}
module.exports={call};
