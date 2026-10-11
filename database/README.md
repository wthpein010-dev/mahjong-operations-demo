# V1.7 代理系统数据库参考

这里全部是人工构造的虚构资料，可以公开用于开发参考。没有真实玩家、手机号、充值订单、登录密码、Token、Cookie 或源系统凭据。公开示例账号不是生产登录账号。

## 文件与用法

- `schema.sqlite.sql` / `seed.sqlite.sql`：SQLite / Cloudflare D1 参考表结构和示例数据。先建表，再导入数据。
- `schema.mysql8.sql` / `seed.mysql8.sql`：MySQL 8 兼容参考文件，先导入结构，再导入数据。MySQL 8.0.16 及以上会执行 CHECK 约束；本次未实际连接 MySQL 服务运行。
- `seed-statements.json`：供站点服务端初始化使用，格式为 `{version, seedId, completedKey, completedValue, statements:[{sql,params}], counts}`。每条语句不超过 90 个绑定参数，采用 `?1` 编号参数复用相同值，可用 D1 `prepare(sql).bind(...params)` 执行。不要在浏览器直接访问 D1。
- `seed-manifest.json`：各表行数、虚构声明、日期窗口和原型种子来源哈希。
- `data-dictionary.md`：各字段类型、必填、主键、外键和检查约束。
- `verification.json`：本地 SQLite 实际导入、重复导入、外键、完整性和数据金额核对结果。
- `../public/reference/seed.json`：完整原型数据形状，保留原有字段，同时增加两条迁区示例。SQL 下载文件在同一 `reference` 目录。

生成命令：`node scripts/generate-reference-data.cjs`。校验命令：`python database/verify-reference-data.py`。根目录的 `npm run db:generate` 由 Drizzle 生成 schema-only 迁移；本目录 seed 数据不混入迁移。

SQLite 导入示例：

```sh
sqlite3 reference.sqlite ".read database/schema.sqlite.sql"
sqlite3 reference.sqlite ".read database/seed.sqlite.sql"
```

MySQL 8 导入示例（先自行建立独立开发数据库）：

```sh
mysql --default-character-set=utf8mb4 -u your_user -p your_dev_database < database/schema.mysql8.sql
mysql --default-character-set=utf8mb4 -u your_user -p your_dev_database < database/seed.mysql8.sql
```

SQL 不创建数据库用户，不执行 DELETE、DROP 或转卡。Seed 的 INSERT OR IGNORE / INSERT IGNORE 保留已有同主键资料；需要重新生成示例时使用新的空白开发数据库。已有结构升级使用 Drizzle 迁移，不应反复把建表参考文件当作迁移。

## 业务映射

后台角色记录在 `backend_accounts`；地区负责人在 `managers`，授权区域在 `manager_regions`；总部客服的 `services.region_id` 为 NULL，区域客服只能关联一个区域。普通代理 `agents` 是业务对象，没有自动取得本后台登录权。每代理一个当前区域，每茶馆一个当前代理；玩家与茶馆是多对多关系。

`charges`、`refunds`、`rooms`、`rewards` 的区域为事件发生时快照。代理迁区只改变当前对象归属，不能用当前归属重算历史。两条迁区示例发生于 2026-09-01 / 09-02，早于统计示例窗口（2026-09-11 至 2026-10-10）。未关联茶馆的充值使用 NULL，不能按当前茶馆数均摊。房间玩家列表与当前茶馆成员关系分别保存，后续离馆不改写历史对局。

所有金额使用整数分，所有奖励比例使用整数基点。3% 保存为 300。奖励按订单四舍五入到分；`refund_reversal` 为负数，并指向原订单和退款。示例包含一笔总部客服订单退款，以覆盖扣回路径。代理及客服均无转卡执行权限；`transfers` 只保存虚构历史查询资料。

## 演示持久化与正式实体接口

`demo_snapshots` 的 `public-v17` 保存公开只读参考快照，初始版本为 0。个人演示修改由服务端在独立沙盒快照内保存，不覆盖公共快照。`demo_seed_meta` 的 `seed-version = v1.7` 为初始化完成标记，应在全部种子语句成功后写入；中途失败可以幂等重试。

规范化业务表保存初始开发参考数据。沙盒快照保存原型的完整状态，两者不是自动双向同步的生产模型。正式接入时应由实体接口事务维护关系、历史快照和审计，不可把公开角色选择器或任意 JSON 快照写入当作生产权限控制。
