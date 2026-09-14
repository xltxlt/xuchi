const CACHE_TTL=60000;
function call(action,data={},options={}){
  const key=options.cache?'xuchi:'+action+':'+JSON.stringify(data):'';
  if(key){const hit=wx.getStorageSync(key);if(hit&&Date.now()-hit.time<CACHE_TTL)return Promise.resolve(hit.value)}
  if(!wx.cloud||!wx.cloud.callFunction)return Promise.reject(new Error('当前网络环境暂不可用'));
  return wx.cloud.callFunction({name:options.functionName||'api',data:{action,...data}}).then(res=>{
    const value=res.result||res;
    if(value&&value.success===false)throw new Error(value.message||'操作失败');
    if(key)wx.setStorageSync(key,{time:Date.now(),value});
    return value;
  }).catch(err=>{throw err instanceof Error?err:new Error('网络异常，请稍后重试')});
}
module.exports={call};
