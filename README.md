# 雀序 · 麻溜后台开发参考

**V1.7 · 2026-10-11 · MIT 开源**

[打开 GitHub 后台演示](https://wthpein010-dev.github.io/mahjong-operations-demo/) · [开发资料与下载](https://wthpein010-dev.github.io/mahjong-operations-demo/reference.html) · [Sites / D1 运行版](https://mahjong-operations-demo.polite-chord-7994.chatgpt.site/)

围绕区域、地区负责人、普通代理、茶馆、玩家、经营统计与客服协作，提供可运行后台、虚构数据库、SQL 和 OpenAPI 交接资料。GitHub Pages 可直接运行后台，网页、脚本和资料均从 GitHub 加载，无须连接 Sites 域名。原 Sites / Cloudflare D1 运行版保留，两版存储独立。

## 两种运行方式

| 入口 | 数据存储 | 使用范围 |
|---|---|---|
| GitHub Pages `demo/` | 当前浏览器 IndexedDB | 同一浏览器与站点下刷新保留修改，同源标签页共用演示副本；不同浏览器、设备独立，无跨设备同步。清理网站数据或结束无痕会话可能丢失修改。 |
| Sites / D1 | 服务端匿名 Cookie 隔离的 D1 沙盒 | 数据写入服务端数据库；依赖 Sites 域名可达及当前浏览器会话。 |

两版均使用相同的公开虚构参考资料，充值、退款、玩家、对局与历史转卡来源保持只读。GitHub 版的数据库状态页显示实际 IndexedDB 快照与数据对象数量；公开 SQL 的 28 张表、2,510 行是另一份规范化示例，不代表该页面查询在线 D1。SQL、OpenAPI 和接口交接资料可在两版下载。

## 已实现与待对接

- 28 张表，2,510 行虚构参考资料：6 个区域、3 位负责人、7 位客服、24 个代理、48 家茶馆、60 位玩家、360 场对局、240 笔充值。
- Sites 的规范化表与公共快照只读。访客修改由 HttpOnly Cookie 隔离，保存在独立 D1 沙盒 JSON 快照，使用 If-Match 保护版本冲突，不自动回写规范化业务表。
- Sites 的 6 个演示 HTTP 接口已实现，包括状态读取 / 保存 / 重置、实体只读分页、实际数据库统计与 OpenAPI 下载。GitHub Pages 通过本地存储适配器保存演示状态，不托管 HTTP API。
- 49 个业务接口是待对接设计，尚未接入原游戏、真实认证、支付、开户或实体事务。
- SQLite / D1 与 MySQL 8 表结构和种子 SQL 已生成；SQLite 实际导入与一致性校验通过，MySQL 尚未实际执行。
- 阿福完善业务接口与资料后交 Nirvana 对接测试；修复完成再归档 Apifox。OpenAPI 导入文件已准备，**尚未同步实际 Apifox 项目**。

全部示例是虚构资料。公开角色切换只用于体验权限差异，不是生产认证。充值、对局、玩家和历史转卡来源只读；后台没有转卡、退款执行或真实结算操作。Word、真实系统截图、个人资料和凭据不在此仓库。

Sites 首次 GET 建立匿名 Cookie 并返回会话标识；POST / DELETE 携带 `X-Demo-Session` 核对当前会话。首次保存以既定会话身份创建快照，双标签并发通过版本条件控制；重置后轮换 Cookie，旧标签会话请求返回 409。GitHub 版用 IndexedDB 读写事务核对版本，事务完成后才确认保存；过期标签页需要重新加载，恢复初始数据也递增版本。详见 [存储架构](docs/ARCHITECTURE.md)。

## 目录

| 路径 | 用途 |
|---|---|
| `index.html` | GitHub Pages 根入口，保留查询参数转到 `demo/` |
| `reference.html` | 开发资料入口与下载链接 |
| `demo/` | GitHub Pages 可运行后台；`local-database.js` 为手工维护的 IndexedDB 适配器，其余运行文件由构建脚本生成 |
| `public/` | 后台前端源码与可下载公开附件 |
| `app/api/` | 6 个服务端演示接口 |
| `db/schema.ts`、`drizzle/` | Drizzle 数据模型与 schema-only 迁移 |
| `database/` | SQL、幂等 D1 种子语句、字段字典、数据校验 |
| `docs/integration/` | 49 项业务接口需求、阿福 / Nirvana 交接与 Apifox 导入说明 |
| `docs/ARCHITECTURE.md` | 持久化与沙盒边界说明 |
| `build/`、`scripts/` | Vinext / Cloudflare 构建与开发工具 |

## 本地运行

仅运行 GitHub 备用版时，不需要安装依赖或配置 D1：

```sh
node scripts/build-pages-demo.cjs
python -m http.server 8767 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8767/demo/`。页面需通过 HTTP / HTTPS 打开；不要直接双击 HTML 文件。修改 `public/` 网页源码后重新生成 `demo/`，不要直接修改生成文件。浏览器本地演示状态不会导出到公开仓库。

以下步骤用于 Sites / D1 服务端运行版：

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

GitHub 备用版通过 104 个身份/页面组合与实际 IndexedDB 持久化、并发、恢复、失败和隔离检查。详见 [GitHub 备用版验证记录](VERIFICATION-PAGES-V1.7.md)。

本仓库独立发布，不接入 AI Application Hub。项目代码采用 [MIT License](LICENSE)；保留各依赖与 vendored 文件的原始许可证。
