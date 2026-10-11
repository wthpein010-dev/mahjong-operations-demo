# V1.7 虚构数据字典

金额均以整数分存储；比例均以整数基点存储（3% = 300）。业务事件保留发生时的区域、客服及比例快照。

公开角色切换仅用于演示，不构成生产认证。下面的规范化表是开发参考，真实系统对接仍需由接口执行权限和业务校验。

## regions（6 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| name | TEXT | 是 | — |
| wechat | TEXT | 是 | — |
| status | TEXT | 是 | — |
| created_at | TEXT | 是 | 默认 2026-10-11T00:00:00.000Z |

## backend_accounts（11 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| role | TEXT | 是 | — |
| login_account | TEXT | 是 | 唯一 |
| display_name | TEXT | 是 | — |
| status | TEXT | 是 | — |
| created_at | TEXT | 是 | 默认 2026-10-11T00:00:00.000Z |

## managers（3 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键；backend_accounts.id |
| name | TEXT | 是 | — |
| account | TEXT | 是 | 唯一 |
| game_id | TEXT | 是 | 唯一 |
| status | TEXT | 是 | — |

## manager_regions（6 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| manager_id | TEXT | 是 | managers.id |
| region_id | TEXT | 是 | 唯一；regions.id |

联合主键：manager_id + region_id

## services（7 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键；backend_accounts.id |
| name | TEXT | 是 | — |
| account | TEXT | 是 | 唯一 |
| game_id | TEXT | 是 | 唯一 |
| type | TEXT | 是 | — |
| region_id | TEXT | 否 | regions.id |
| reward_rate_bps | INTEGER | 是 | 默认 0 |
| status | TEXT | 是 | — |

检查约束：`reward_rate_bps >= 0 AND reward_rate_bps <= 2000`；`(type = '总部客服' AND region_id IS NULL) OR (type = '区域客服' AND region_id IS NOT NULL)`

## agents（24 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| name | TEXT | 是 | — |
| account | TEXT | 是 | 唯一 |
| game_id | TEXT | 是 | 唯一 |
| region_id | TEXT | 是 | regions.id |
| service_id | TEXT | 否 | services.id |
| creator_label | TEXT | 是 | — |
| performance_owner | TEXT | 是 | — |
| status | TEXT | 是 | — |
| tea_quota | INTEGER | 是 | — |
| tier | TEXT | 是 | — |
| cards | INTEGER | 是 | — |

检查约束：`tea_quota >= 0`；`cards >= 0`；`performance_owner IN ('company','region')`

## tea_houses（48 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| name | TEXT | 是 | — |
| agent_id | TEXT | 是 | agents.id |
| region_id | TEXT | 是 | regions.id |
| status | TEXT | 是 | — |

## players（60 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| name | TEXT | 是 | — |
| status | TEXT | 是 | — |

## player_tea_memberships（120 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| player_id | TEXT | 是 | players.id |
| tea_id | TEXT | 是 | tea_houses.id |

联合主键：player_id + tea_id

## rooms（360 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| event_date | TEXT | 是 | — |
| region_id | TEXT | 是 | regions.id |
| agent_id | TEXT | 是 | agents.id |
| tea_id | TEXT | 是 | tea_houses.id |
| game | TEXT | 是 | — |
| status | TEXT | 是 | — |
| rounds | INTEGER | 是 | — |
| cards | INTEGER | 是 | — |

检查约束：`rounds >= 0`；`cards >= 0`

## room_players（1440 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| room_id | TEXT | 是 | rooms.id |
| player_id | TEXT | 是 | players.id |

联合主键：room_id + player_id

## charges（240 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| event_date | TEXT | 是 | — |
| region_id | TEXT | 是 | regions.id |
| agent_id | TEXT | 是 | agents.id |
| tea_id | TEXT | 否 | tea_houses.id |
| player_id | TEXT | 是 | players.id |
| amount_cents | INTEGER | 是 | — |
| service_id | TEXT | 否 | services.id |
| reward_rate_bps | INTEGER | 是 | — |
| performance_owner | TEXT | 是 | — |
| status | TEXT | 是 | — |

检查约束：`amount_cents >= 0`；`reward_rate_bps >= 0 AND reward_rate_bps <= 2000`

## refunds（9 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| charge_id | TEXT | 是 | 唯一；charges.id |
| event_date | TEXT | 是 | — |
| region_id | TEXT | 是 | regions.id |
| agent_id | TEXT | 是 | agents.id |
| amount_cents | INTEGER | 是 | — |
| status | TEXT | 是 | — |

检查约束：`amount_cents > 0`

## rewards（91 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| charge_id | TEXT | 是 | charges.id |
| refund_id | TEXT | 否 | refunds.id |
| service_id | TEXT | 是 | services.id |
| region_id | TEXT | 是 | regions.id |
| event_date | TEXT | 是 | — |
| kind | TEXT | 是 | — |
| base_cents | INTEGER | 是 | — |
| rate_bps | INTEGER | 是 | — |
| amount_cents | INTEGER | 是 | — |
| status | TEXT | 是 | — |

检查约束：`base_cents >= 0`；`rate_bps >= 0 AND rate_bps <= 2000`；`kind IN ('accrual','refund_reversal')`；`(kind = 'accrual' AND amount_cents >= 0 AND refund_id IS NULL) OR (kind = 'refund_reversal' AND amount_cents <= 0 AND refund_id IS NOT NULL)`

## transfers（24 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| event_date | TEXT | 是 | — |
| region_id | TEXT | 是 | regions.id |
| agent_id | TEXT | 是 | agents.id |
| game_id | TEXT | 是 | — |
| from_label | TEXT | 是 | — |
| to_label | TEXT | 是 | — |
| cards | INTEGER | 是 | — |
| operator_label | TEXT | 是 | — |
| remark | TEXT | 是 | — |

检查约束：`cards >= 0`

## migrations（2 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| agent_id | TEXT | 是 | agents.id |
| from_region_id | TEXT | 是 | regions.id |
| to_region_id | TEXT | 是 | regions.id |
| service_id | TEXT | 否 | services.id |
| operator_id | TEXT | 是 | backend_accounts.id |
| event_date | TEXT | 是 | — |
| reason | TEXT | 是 | — |
| tea_ids_json | TEXT | 是 | — |

检查约束：`from_region_id <> to_region_id`

## tickets（12 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| title | TEXT | 是 | — |
| description | TEXT | 是 | — |
| region_id | TEXT | 是 | regions.id |
| agent_id | TEXT | 是 | agents.id |
| owner_id | TEXT | 否 | services.id |
| creator_id | TEXT | 是 | backend_accounts.id |
| event_date | TEXT | 是 | — |
| status | TEXT | 是 | — |
| priority | TEXT | 是 | — |
| response_hours | INTEGER | 是 | 默认 24 |
| resolve_days | INTEGER | 是 | 默认 3 |

## ticket_comments（9 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| ticket_id | TEXT | 是 | tickets.id |
| actor_label | TEXT | 是 | — |
| event_date | TEXT | 是 | — |
| body | TEXT | 是 | — |

## announcements（2 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| title | TEXT | 是 | — |
| body | TEXT | 是 | — |
| creator_id | TEXT | 是 | backend_accounts.id |
| event_date | TEXT | 是 | — |
| status | TEXT | 是 | — |
| version | INTEGER | 是 | — |

检查约束：`version >= 1`

## announcement_regions（8 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| announcement_id | TEXT | 是 | announcements.id |
| region_id | TEXT | 是 | regions.id |

联合主键：announcement_id + region_id

## messages（3 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| owner_id | TEXT | 是 | backend_accounts.id |
| title | TEXT | 是 | — |
| source | TEXT | 是 | — |
| event_date | TEXT | 是 | — |
| regions_json | TEXT | 是 | — |

## data_tasks（3 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| name | TEXT | 是 | — |
| owner_id | TEXT | 是 | backend_accounts.id |
| event_date | TEXT | 是 | — |
| status | TEXT | 是 | — |
| record_count | INTEGER | 是 | — |
| note | TEXT | 是 | — |

检查约束：`record_count >= 0`

## data_task_regions（5 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| task_id | TEXT | 是 | data_tasks.id |
| region_id | TEXT | 是 | regions.id |

联合主键：task_id + region_id

## access_records（8 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| owner_id | TEXT | 是 | backend_accounts.id |
| event_date | TEXT | 是 | — |
| event_time | TEXT | 是 | — |
| result | TEXT | 是 | — |
| device | TEXT | 是 | — |
| source_label | TEXT | 是 | — |
| reason | TEXT | 是 | — |

## audit（1 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| event_time | TEXT | 是 | — |
| actor_label | TEXT | 是 | — |
| account_label | TEXT | 是 | — |
| action | TEXT | 是 | — |
| regions_json | TEXT | 是 | — |

## system_config（4 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| key | TEXT | 是 | 主键 |
| value_json | TEXT | 是 | — |
| version | INTEGER | 是 | — |
| updated_at | TEXT | 是 | — |

## demo_snapshots（1 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| id | TEXT | 是 | 主键 |
| data_json | TEXT | 是 | — |
| revision | INTEGER | 是 | 默认 0 |
| updated_at | TEXT | 是 | — |

检查约束：`revision >= 0`

## demo_seed_meta（3 条）

| 字段 | SQLite类型 | 必填 | 关系 / 约束 |
|---|---|---|---|
| key | TEXT | 是 | 主键 |
| value | TEXT | 是 | — |
