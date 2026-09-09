# 许吃｜产品化收口

## 核心产品闭环
吃 → 许吃 → 口味标签 → 口味画像 → 同好 → 个性化推荐 → 分享 → 成长 → 再推荐。

## 核心指标
- 许吃率：用户对菜品的 yes / 全部行为
- 推荐命中率：推荐曝光后产生“许吃”的比例
- 同好相似度：用户 taste + identity tags 的重合度
- 内容贡献：发布、评论、评论获赞
- 成长经验：许吃 5 EXP、收藏 2 EXP、评论 3 EXP、发布 20 EXP、关注 2 EXP

## 产品化模块
- 同好动态 / 同好详情 / 推荐理由
- 口味雷达与动态口味画像
- 等级与勋章
- GPS 附近菜品 / 店铺
- AI 菜品识别与口味标签接口
- 评论点赞 / 回复 / 消息中心
- 商家认领 / 商家数据 / 优惠券
- 内容审核、限流、缓存、分页

## 商业闭环
商家认领 → 菜品数据 → 同好人群 → 精准优惠券 → 到店 → 用户内容 → 商家数据。

## 上线前必须完成
1. 替换 `YOUR_ENV_ID`。
2. 部署 `cloudfunctions/api`。
3. 创建 `database/init.json` 中集合并配置 `database/rules.json`。
4. 接入微信内容安全接口与图片审核。
5. AI 视觉模型在云函数环境配置 `AI_ENDPOINT` 和鉴权。
6. 给 dishes/storeId、user_actions/openid+dishId、comments/dishId+createdAt 等建立索引。
7. 对 merchant、coupon、用户经验等关键字段只允许云函数写入。
