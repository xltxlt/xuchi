const levels=[['初来乍吃',0],['小吃货',100],['好吃佬',200],['资深吃货',350],['美食家',500],['许吃大师',800]];
const badges=[['first','第一口','🍽️',1],['hundred','百味尝鲜','💯',100],['night','夜猫子','🌙',10],['local','本地通','📍',30],['recommend','推荐达人','🔥',10],['master','许吃大师','👑',800]];
function level(exp=0){let i=0;levels.forEach((x,n)=>{if(exp>=x[1])i=n});return{level:i+1,name:levels[i][0],next:levels[Math.min(i+1,levels.length-1)][1],exp}}
module.exports={levels,badges,level};
