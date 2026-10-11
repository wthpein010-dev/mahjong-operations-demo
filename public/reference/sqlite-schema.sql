PRAGMA foreign_keys = ON;

-- Fictional V1.7 development reference. No database or user is created.

CREATE TABLE IF NOT EXISTS `regions` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `wechat` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `created_at` TEXT NOT NULL DEFAULT '2026-10-11T00:00:00.000Z'
);

CREATE TABLE IF NOT EXISTS `backend_accounts` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `role` TEXT NOT NULL,
  `login_account` TEXT NOT NULL UNIQUE,
  `display_name` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `created_at` TEXT NOT NULL DEFAULT '2026-10-11T00:00:00.000Z'
);

CREATE TABLE IF NOT EXISTS `managers` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `account` TEXT NOT NULL UNIQUE,
  `game_id` TEXT NOT NULL UNIQUE,
  `status` TEXT NOT NULL,
  FOREIGN KEY (`id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `manager_regions` (
  `manager_id` TEXT NOT NULL,
  `region_id` TEXT NOT NULL UNIQUE,
  PRIMARY KEY (`manager_id`, `region_id`),
  FOREIGN KEY (`manager_id`) REFERENCES `managers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `services` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `account` TEXT NOT NULL UNIQUE,
  `game_id` TEXT NOT NULL UNIQUE,
  `type` TEXT NOT NULL,
  `region_id` TEXT,
  `reward_rate_bps` INTEGER NOT NULL DEFAULT 0,
  `status` TEXT NOT NULL,
  FOREIGN KEY (`id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `services_check_0` CHECK (reward_rate_bps >= 0 AND reward_rate_bps <= 2000),
  CONSTRAINT `services_check_1` CHECK ((type = '总部客服' AND region_id IS NULL) OR (type = '区域客服' AND region_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS `agents` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `account` TEXT NOT NULL UNIQUE,
  `game_id` TEXT NOT NULL UNIQUE,
  `region_id` TEXT NOT NULL,
  `service_id` TEXT,
  `creator_label` TEXT NOT NULL,
  `performance_owner` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `tea_quota` INTEGER NOT NULL,
  `tier` TEXT NOT NULL,
  `cards` INTEGER NOT NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `agents_check_0` CHECK (tea_quota >= 0),
  CONSTRAINT `agents_check_1` CHECK (cards >= 0),
  CONSTRAINT `agents_check_2` CHECK (performance_owner IN ('company','region'))
);

CREATE TABLE IF NOT EXISTS `tea_houses` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `agent_id` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `players` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `status` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `player_tea_memberships` (
  `player_id` TEXT NOT NULL,
  `tea_id` TEXT NOT NULL,
  PRIMARY KEY (`player_id`, `tea_id`),
  FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`tea_id`) REFERENCES `tea_houses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `rooms` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `event_date` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  `agent_id` TEXT NOT NULL,
  `tea_id` TEXT NOT NULL,
  `game` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `rounds` INTEGER NOT NULL,
  `cards` INTEGER NOT NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`tea_id`) REFERENCES `tea_houses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `rooms_check_0` CHECK (rounds >= 0),
  CONSTRAINT `rooms_check_1` CHECK (cards >= 0)
);

CREATE TABLE IF NOT EXISTS `room_players` (
  `room_id` TEXT NOT NULL,
  `player_id` TEXT NOT NULL,
  PRIMARY KEY (`room_id`, `player_id`),
  FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `charges` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `event_date` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  `agent_id` TEXT NOT NULL,
  `tea_id` TEXT,
  `player_id` TEXT NOT NULL,
  `amount_cents` INTEGER NOT NULL,
  `service_id` TEXT,
  `reward_rate_bps` INTEGER NOT NULL,
  `performance_owner` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`tea_id`) REFERENCES `tea_houses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `charges_check_0` CHECK (amount_cents >= 0),
  CONSTRAINT `charges_check_1` CHECK (reward_rate_bps >= 0 AND reward_rate_bps <= 2000)
);

CREATE TABLE IF NOT EXISTS `refunds` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `charge_id` TEXT NOT NULL UNIQUE,
  `event_date` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  `agent_id` TEXT NOT NULL,
  `amount_cents` INTEGER NOT NULL,
  `status` TEXT NOT NULL,
  FOREIGN KEY (`charge_id`) REFERENCES `charges` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `refunds_check_0` CHECK (amount_cents > 0)
);

CREATE TABLE IF NOT EXISTS `rewards` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `charge_id` TEXT NOT NULL,
  `refund_id` TEXT,
  `service_id` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  `event_date` TEXT NOT NULL,
  `kind` TEXT NOT NULL,
  `base_cents` INTEGER NOT NULL,
  `rate_bps` INTEGER NOT NULL,
  `amount_cents` INTEGER NOT NULL,
  `status` TEXT NOT NULL,
  FOREIGN KEY (`charge_id`) REFERENCES `charges` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`refund_id`) REFERENCES `refunds` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `rewards_check_0` CHECK (base_cents >= 0),
  CONSTRAINT `rewards_check_1` CHECK (rate_bps >= 0 AND rate_bps <= 2000),
  CONSTRAINT `rewards_check_2` CHECK (kind IN ('accrual','refund_reversal')),
  CONSTRAINT `rewards_check_3` CHECK ((kind = 'accrual' AND amount_cents >= 0 AND refund_id IS NULL) OR (kind = 'refund_reversal' AND amount_cents <= 0 AND refund_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS `transfers` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `event_date` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  `agent_id` TEXT NOT NULL,
  `game_id` TEXT NOT NULL,
  `from_label` TEXT NOT NULL,
  `to_label` TEXT NOT NULL,
  `cards` INTEGER NOT NULL,
  `operator_label` TEXT NOT NULL,
  `remark` TEXT NOT NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `transfers_check_0` CHECK (cards >= 0)
);

CREATE TABLE IF NOT EXISTS `migrations` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `agent_id` TEXT NOT NULL,
  `from_region_id` TEXT NOT NULL,
  `to_region_id` TEXT NOT NULL,
  `service_id` TEXT,
  `operator_id` TEXT NOT NULL,
  `event_date` TEXT NOT NULL,
  `reason` TEXT NOT NULL,
  `tea_ids_json` TEXT NOT NULL,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`from_region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`to_region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`operator_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `migrations_check_0` CHECK (from_region_id <> to_region_id)
);

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `title` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  `agent_id` TEXT NOT NULL,
  `owner_id` TEXT,
  `creator_id` TEXT NOT NULL,
  `event_date` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `priority` TEXT NOT NULL,
  `response_hours` INTEGER NOT NULL DEFAULT 24,
  `resolve_days` INTEGER NOT NULL DEFAULT 3,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`owner_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`creator_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `ticket_comments` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `ticket_id` TEXT NOT NULL,
  `actor_label` TEXT NOT NULL,
  `event_date` TEXT NOT NULL,
  `body` TEXT NOT NULL,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `title` TEXT NOT NULL,
  `body` TEXT NOT NULL,
  `creator_id` TEXT NOT NULL,
  `event_date` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `version` INTEGER NOT NULL,
  FOREIGN KEY (`creator_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `announcements_check_0` CHECK (version >= 1)
);

CREATE TABLE IF NOT EXISTS `announcement_regions` (
  `announcement_id` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  PRIMARY KEY (`announcement_id`, `region_id`),
  FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `messages` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `owner_id` TEXT NOT NULL,
  `title` TEXT NOT NULL,
  `source` TEXT NOT NULL,
  `event_date` TEXT NOT NULL,
  `regions_json` TEXT NOT NULL,
  FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `data_tasks` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `owner_id` TEXT NOT NULL,
  `event_date` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `record_count` INTEGER NOT NULL,
  `note` TEXT NOT NULL,
  FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `data_tasks_check_0` CHECK (record_count >= 0)
);

CREATE TABLE IF NOT EXISTS `data_task_regions` (
  `task_id` TEXT NOT NULL,
  `region_id` TEXT NOT NULL,
  PRIMARY KEY (`task_id`, `region_id`),
  FOREIGN KEY (`task_id`) REFERENCES `data_tasks` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `access_records` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `owner_id` TEXT NOT NULL,
  `event_date` TEXT NOT NULL,
  `event_time` TEXT NOT NULL,
  `result` TEXT NOT NULL,
  `device` TEXT NOT NULL,
  `source_label` TEXT NOT NULL,
  `reason` TEXT NOT NULL,
  FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS `audit` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `event_time` TEXT NOT NULL,
  `actor_label` TEXT NOT NULL,
  `account_label` TEXT NOT NULL,
  `action` TEXT NOT NULL,
  `regions_json` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `system_config` (
  `key` TEXT PRIMARY KEY NOT NULL,
  `value_json` TEXT NOT NULL,
  `version` INTEGER NOT NULL,
  `updated_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `demo_snapshots` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `data_json` TEXT NOT NULL,
  `revision` INTEGER NOT NULL DEFAULT 0,
  `updated_at` TEXT NOT NULL,
  CONSTRAINT `demo_snapshots_check_0` CHECK (revision >= 0)
);

CREATE TABLE IF NOT EXISTS `demo_seed_meta` (
  `key` TEXT PRIMARY KEY NOT NULL,
  `value` TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS `agents_region_id_service_id_idx` ON `agents` (`region_id`, `service_id`);

CREATE INDEX IF NOT EXISTS `tea_houses_region_id_agent_id_idx` ON `tea_houses` (`region_id`, `agent_id`);

CREATE INDEX IF NOT EXISTS `rooms_region_id_event_date_idx` ON `rooms` (`region_id`, `event_date`);

CREATE INDEX IF NOT EXISTS `charges_region_id_event_date_idx` ON `charges` (`region_id`, `event_date`);

CREATE INDEX IF NOT EXISTS `refunds_region_id_event_date_idx` ON `refunds` (`region_id`, `event_date`);

CREATE INDEX IF NOT EXISTS `rewards_service_id_event_date_idx` ON `rewards` (`service_id`, `event_date`);

CREATE INDEX IF NOT EXISTS `tickets_region_id_owner_id_status_idx` ON `tickets` (`region_id`, `owner_id`, `status`);

CREATE INDEX IF NOT EXISTS `audit_event_time_idx` ON `audit` (`event_time`);
