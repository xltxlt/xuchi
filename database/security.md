# 云数据库权限建议

生产环境建议：users/user_actions/favorites/comment_likes/follows/coupon_users 按用户隔离；comments/posts/stores/dishes/coupons 公开读取；商家认领、优惠券、统计、关键业务字段统一通过云函数写入。

敏感操作不要开放客户端直接写入，避免伪造许吃次数、经验值、商家统计等数据。
