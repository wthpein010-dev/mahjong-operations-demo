# V1.7 数据库演示架构

public/ 是网页源码，dist/ 是 Vinext 构建输出，修改源码后重新构建。服务端使用 Cloudflare D1。db/schema.ts 和 drizzle/ 描述结构，迁移只含 schema；database/seed-statements.json 在首次读请求中幂等写入虚构基线，不在请求中创建或修改表。

28张表共2,510行初始数据。规范化表公开只读，demo_snapshots 的 public-v17 保存完整公共状态，revision 为0。浏览器首次读取获得随机 HttpOnly Cookie 与其 SHA-256 指纹 sessionId，此时尚不创建沙盒记录；首次保存才为既定身份创建独立快照。POST/DELETE 带 Cookie 和 X-Demo-Session，指纹不是 Cookie 或授权凭据；指纹变化拒绝409 SESSION_CONFLICT。POST另通过数字 If-Match 和 SQL 条件更新防止覆盖；DELETE删除本人快照并轮换Cookie及sessionId，旧标签页需重新读取。公开快照不受访客操作影响。

沙盒快照不会自动回写代理、茶馆等实体表。这是供开发参考的演示层；真实实体接口需程序按业务权限和事务要求实施。角色切换只展示页面差异，不表示已具备生产授权。源充值、玩家、对局和转卡数据在演示服务端保持只读。

接口交接以 docs/integration/ 和 OpenAPI 为准。阿福完善接口后交 Nirvana 联调，修复完成再归档 Apifox。当前业务接口仍待接，不能把演示状态接口作为正式开户、资金或迁区接口。

## GitHub Pages 备用运行版

GitHub Pages 直接运行 demo/ 下的静态后台，根 index.html 保留查询参数跳转到该目录，reference.html 提供开发资料入口。所有必需网页资源与下载文件来自当前 Pages 仓库子路径，无运行时 Sites 请求。scripts/build-pages-demo.cjs 从 public/ 复用页面、样式和业务交互，只适配数据请求、下载路径与存储文案；demo/local-database.js 是手工维护的存储边界，其余 demo/ 运行文件均为构建产物。

演示状态保存在 IndexedDB 中的本地快照，初始状态来自 public/reference/seed.json。写入在同一个 readwrite 事务内读取并检查版本、执行修改；只有事务 complete 才向页面确认保存成功。恢复初始数据也递增版本，避免旧标签覆盖恢复结果。版本过期则显示冲突并要求重新加载，数据库拒绝访问、事务中止或容量失败均显式报告，不回退到旧缓存。

此模式的数据只保存在当前浏览器与站点下，同源标签共用副本；不同设备或浏览器独立，无跨设备同步。清理网站数据或结束无痕会话可能删除修改。它没有服务端 D1、身份鉴权、跨访客共享或生产业务接口。只读来源校验继续用于演示体验，不构成生产安全边界。参考页显示实际 IndexedDB 快照记录与其中的数据对象数量；下载资料中的 28 张表与 2,510 行表示独立的规范化 SQL 示例，不宣称在线查询 D1。Sites 版的真实服务端 D1 与接口不受此构建影响。
