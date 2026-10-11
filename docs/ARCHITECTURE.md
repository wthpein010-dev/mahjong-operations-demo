# V1.7 数据库演示架构

public/ 是网页源码，dist/ 是 Vinext 构建输出，修改源码后重新构建。服务端使用 Cloudflare D1。db/schema.ts 和 drizzle/ 描述结构，迁移只含 schema；database/seed-statements.json 在首次读请求中幂等写入虚构基线，不在请求中创建或修改表。

28张表共2,510行初始数据。规范化表公开只读，demo_snapshots 的 public-v17 保存完整公共状态，revision 为0。浏览器首次读取获得随机 HttpOnly Cookie 与其 SHA-256 指纹 sessionId，此时尚不创建沙盒记录；首次保存才为既定身份创建独立快照。POST/DELETE 带 Cookie 和 X-Demo-Session，指纹不是 Cookie 或授权凭据；指纹变化拒绝409 SESSION_CONFLICT。POST另通过数字 If-Match 和 SQL 条件更新防止覆盖；DELETE删除本人快照并轮换Cookie及sessionId，旧标签页需重新读取。公开快照不受访客操作影响。

沙盒快照不会自动回写代理、茶馆等实体表。这是供开发参考的演示层；真实实体接口需程序按业务权限和事务要求实施。角色切换只展示页面差异，不表示已具备生产授权。源充值、玩家、对局和转卡数据在演示服务端保持只读。

接口交接以 docs/integration/ 和 OpenAPI 为准。阿福完善接口后交 Nirvana 联调，修复完成再归档 Apifox。当前业务接口仍待接，不能把演示状态接口作为正式开户、资金或迁区接口。
