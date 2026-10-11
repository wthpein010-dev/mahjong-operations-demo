# GitHub Pages V1.7 备用后台验证 · 2026-10-11

此验证覆盖浏览器 IndexedDB 备用版。原 Sites / D1 服务端源码与业务规则保持原版本；对应验证见 VERIFICATION-V1.7.md。

- 从同一 checkout 的 public/ 生成 demo/，原始前端未修改。local-database.js 为维护源码，其余 demo/ 运行文件由 scripts/build-pages-demo.cjs 生成。
- scripts/test-pages-demo.cjs 在真实 Chromium 中通过 104 个身份与页面组合，并验证完整 19 字段基线、刷新持久化、多个标签页版本冲突、冲突重载、同版本并发仅一次提交、并发首次初始化、恢复初始数据及会话轮换。
- 四类源数据只读检查通过；容量异常与真实事务中止均未持久化或假报成功。数据库不可用时不启用操作，保留 SQL / OpenAPI 下载入口；独立浏览器上下文数据隔离。
- 后台运行测试未发出外域请求；SQL / JSON / OpenAPI 下载路径正确。GitHub 不运行服务端 HTTP API，页面没有 Sites 运行依赖。
- 根入口在 /mahjong-operations-demo/ 子路径下保留查询参数，进入后台；14 份运行与下载文件经本地 HTTP 200、SHA-256 完整内容核对，HTML 引用均留在仓库子路径。
- Codex 浏览器独立验证配置由 24 改为 18 小时，保存后刷新仍保留；390px 手机布局检查后收短提示条、将说明与资料链接纵向排列。
- 独立只读审查通过公开边界与链接检查；修复 DESIGN.md 的过期入口说明，并明确 UX-CONTRACT.md 中服务端会话规则仅适用于 Sites / D1。

示例为虚构数据，身份选择用于权限体验。浏览器本地状态没有跨设备同步；清理站点数据或关闭无痕会话可能删除修改。生产认证和业务接口尚未接入，Apifox 仅提供导入文件，未远端同步。

## 复现

```sh
node scripts/build-pages-demo.cjs
node scripts/test-pages-demo.cjs
```

测试需要可导入的 Playwright 与 Chromium。可通过 PLAYWRIGHT_MODULE 指定已有 Playwright 模块路径，通过 PLAYWRIGHT_EXECUTABLE_PATH 指定已安装的 Chromium / Chrome；当前使用机器已有依赖完成验证，没有在仓库保存浏览器、依赖目录或运行状态。
