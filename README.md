# 雀序 · 麻溜后台开发参考

**V1.7 · 2026-10-11 · MIT 开源**

[打开数据库后台演示](https://mahjong-operations-demo.polite-chord-7994.chatgpt.site/) · [开发资料入口](https://wthpein010-dev.github.io/mahjong-operations-demo/)

围绕区域、地区负责人、普通代理、茶馆、玩家、经营统计与客服协作，提供可运行后台、虚构数据库、SQL 和 OpenAPI 交接资料。GitHub Pages 是资料入口；数据库运行版托管在 Sites / Cloudflare D1。

## 已实现与待对接

- 28 张表，2,510 行虚构参考资料：6 个区域、3 位负责人、7 位客服、24 个代理、48 家茶馆、60 位玩家、360 场对局、240 笔充值。
- 规范化表与公共快照只读。访客修改由 HttpOnly Cookie 隔离，保存在独立 D1 沙盒 JSON 快照，使用 If-Match 保护版本冲突，不自动回写规范化业务表。
- 6 个演示接口已实现，包括状态读取 / 保存 / 重置、实体只读分页、实际数据库统计与 OpenAPI 下载。
- 49 个业务接口是待对接设计，尚未接入原游戏、真实认证、支付、开户或实体事务。
- SQLite / D1 与 MySQL 8 表结构和种子 SQL 已生成；SQLite 实际导入与一致性校验通过，MySQL 尚未实际执行。
- 阿福完善业务接口与资料后交 Nirvana 对接测试；修复完成再归档 Apifox。OpenAPI 导入文件已准备，**尚未同步实际 Apifox 项目**。

全部示例是虚构资料。公开角色切换只用于体验权限差异，不是生产认证。充值、对局、玩家和历史转卡来源只读；后台没有转卡、退款执行或真实结算操作。Word、真实系统截图、个人资料和凭据不在此仓库。

首次 GET 建立匿名 Cookie 并返回会话标识；POST / DELETE 携带 `X-Demo-Session` 核对当前会话。首次保存以既定会话身份创建快照，双标签并发通过版本条件控制；重置后轮换 Cookie，旧标签会话请求返回 409。详见 [会话架构](docs/ARCHITECTURE.md)。

## 目录

| 路径 | 用途 |
|---|---|
| `index.html` | GitHub Pages 开发资料入口 |
| `public/` | 后台前端源码与可下载公开附件 |
| `app/api/` | 6 个服务端演示接口 |
| `db/schema.ts`、`drizzle/` | Drizzle 数据模型与 schema-only 迁移 |
| `database/` | SQL、幂等 D1 种子语句、字段字典、数据校验 |
| `docs/integration/` | 49 项业务接口需求、阿福 / Nirvana 交接与 Apifox 导入说明 |
| `docs/ARCHITECTURE.md` | 持久化与沙盒边界说明 |
| `build/`、`scripts/` | Vinext / Cloudflare 构建与开发工具 |

## 本地运行

要求 Node.js ≥ 22.13。项目使用 Vinext / Vite 与本地 Cloudflare D1。公开 `.openai/hosting.json` 仅提供 `DB` 绑定占位，没有维护项目 ID 或任何凭据。

```sh
npm ci
npm run build
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_confused_brother_voodoo.sql
npm start -- --port 8766
```

打开 `http://127.0.0.1:8766`。表结构来自迁移；首次读取接口时幂等写入虚构基线。请求不创建或修改表。

```sh
node scripts/test-api.mjs http://127.0.0.1:8766
python database/verify-reference-data.py
```

`dist/`、`.wrangler/`、`.next/`、`.sites-runtime/`、`node_modules/`、`.env*` 均属于本地构建或环境资料，不提交。正式部署应配置自己的项目、D1 与生产认证，不能将本演示权限模型直接用于真实资产。

## 数据与接口下载

- [SQLite / D1 结构](public/reference/sqlite-schema.sql) / [种子数据](public/reference/sqlite-seed.sql)
- [MySQL 8 结构](public/reference/mysql-schema.sql) / [种子数据](public/reference/mysql-seed.sql)
- [完整虚构 JSON](public/reference/seed.json) / [数据清单](database/seed-manifest.json)
- [字段字典](database/data-dictionary.md) / [SQL 导入说明](database/README.md)
- [OpenAPI 3.0.3](public/reference/openapi.json) / [Apifox 导入步骤](docs/integration/APIFOX-IMPORT.md)
- [接口对接需求与交接清单](docs/integration/接口对接需求及交接清单_V1.7.md)

## 验证记录

生产 Sites V1.7 部署成功，23 项真实 HTTP 接口检查通过。SQLite 已验证 literal SQL 与 D1 绑定语句导入、幂等重复导入、中断恢复、外键、整数金额与退款计奖扣回。详见 [V1.7 验证记录](VERIFICATION-V1.7.md) 和 [SQL 校验结果](database/verification.json)。

本仓库独立发布，不接入 AI Application Hub。项目代码采用 [MIT License](LICENSE)；保留各依赖与 vendored 文件的原始许可证。
