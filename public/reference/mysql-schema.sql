SET NAMES utf8mb4;

-- Fictional V1.7 development reference. No database or user is created.

CREATE TABLE IF NOT EXISTS `regions` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `wechat` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `created_at` VARCHAR(255) NOT NULL DEFAULT '2026-10-11T00:00:00.000Z'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `backend_accounts` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `login_account` VARCHAR(255) NOT NULL UNIQUE,
  `display_name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `created_at` VARCHAR(255) NOT NULL DEFAULT '2026-10-11T00:00:00.000Z'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `managers` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `account` VARCHAR(255) NOT NULL UNIQUE,
  `game_id` VARCHAR(255) NOT NULL UNIQUE,
  `status` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `manager_regions` (
  `manager_id` VARCHAR(80) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL UNIQUE,
  PRIMARY KEY (`manager_id`, `region_id`),
  FOREIGN KEY (`manager_id`) REFERENCES `managers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `account` VARCHAR(255) NOT NULL UNIQUE,
  `game_id` VARCHAR(255) NOT NULL UNIQUE,
  `type` VARCHAR(255) NOT NULL,
  `region_id` VARCHAR(80),
  `reward_rate_bps` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `services_check_0` CHECK (reward_rate_bps >= 0 AND reward_rate_bps <= 2000),
  CONSTRAINT `services_check_1` CHECK ((type = '总部客服' AND region_id IS NULL) OR (type = '区域客服' AND region_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `agents` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `account` VARCHAR(255) NOT NULL UNIQUE,
  `game_id` VARCHAR(255) NOT NULL UNIQUE,
  `region_id` VARCHAR(80) NOT NULL,
  `service_id` VARCHAR(80),
  `creator_label` VARCHAR(255) NOT NULL,
  `performance_owner` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `tea_quota` INT NOT NULL,
  `tier` VARCHAR(255) NOT NULL,
  `cards` INT NOT NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `agents_check_0` CHECK (tea_quota >= 0),
  CONSTRAINT `agents_check_1` CHECK (cards >= 0),
  CONSTRAINT `agents_check_2` CHECK (performance_owner IN ('company','region')),
  INDEX `agents_region_id_service_id_idx` (`region_id`, `service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `tea_houses` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `agent_id` VARCHAR(80) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX `tea_houses_region_id_agent_id_idx` (`region_id`, `agent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `players` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `player_tea_memberships` (
  `player_id` VARCHAR(80) NOT NULL,
  `tea_id` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`player_id`, `tea_id`),
  FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`tea_id`) REFERENCES `tea_houses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `rooms` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  `agent_id` VARCHAR(80) NOT NULL,
  `tea_id` VARCHAR(80) NOT NULL,
  `game` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `rounds` INT NOT NULL,
  `cards` INT NOT NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`tea_id`) REFERENCES `tea_houses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `rooms_check_0` CHECK (rounds >= 0),
  CONSTRAINT `rooms_check_1` CHECK (cards >= 0),
  INDEX `rooms_region_id_event_date_idx` (`region_id`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `room_players` (
  `room_id` VARCHAR(80) NOT NULL,
  `player_id` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`room_id`, `player_id`),
  FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `charges` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  `agent_id` VARCHAR(80) NOT NULL,
  `tea_id` VARCHAR(80),
  `player_id` VARCHAR(80) NOT NULL,
  `amount_cents` BIGINT NOT NULL,
  `service_id` VARCHAR(80),
  `reward_rate_bps` INT NOT NULL,
  `performance_owner` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`tea_id`) REFERENCES `tea_houses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `charges_check_0` CHECK (amount_cents >= 0),
  CONSTRAINT `charges_check_1` CHECK (reward_rate_bps >= 0 AND reward_rate_bps <= 2000),
  INDEX `charges_region_id_event_date_idx` (`region_id`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `refunds` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `charge_id` VARCHAR(80) NOT NULL UNIQUE,
  `event_date` VARCHAR(255) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  `agent_id` VARCHAR(80) NOT NULL,
  `amount_cents` BIGINT NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`charge_id`) REFERENCES `charges` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `refunds_check_0` CHECK (amount_cents > 0),
  INDEX `refunds_region_id_event_date_idx` (`region_id`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `rewards` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `charge_id` VARCHAR(80) NOT NULL,
  `refund_id` VARCHAR(80),
  `service_id` VARCHAR(80) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `kind` VARCHAR(255) NOT NULL,
  `base_cents` BIGINT NOT NULL,
  `rate_bps` INT NOT NULL,
  `amount_cents` BIGINT NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`charge_id`) REFERENCES `charges` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`refund_id`) REFERENCES `refunds` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `rewards_check_0` CHECK (base_cents >= 0),
  CONSTRAINT `rewards_check_1` CHECK (rate_bps >= 0 AND rate_bps <= 2000),
  CONSTRAINT `rewards_check_2` CHECK (kind IN ('accrual','refund_reversal')),
  CONSTRAINT `rewards_check_3` CHECK ((kind = 'accrual' AND amount_cents >= 0 AND refund_id IS NULL) OR (kind = 'refund_reversal' AND amount_cents <= 0 AND refund_id IS NOT NULL)),
  INDEX `rewards_service_id_event_date_idx` (`service_id`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `transfers` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  `agent_id` VARCHAR(80) NOT NULL,
  `game_id` VARCHAR(255) NOT NULL,
  `from_label` VARCHAR(255) NOT NULL,
  `to_label` VARCHAR(255) NOT NULL,
  `cards` INT NOT NULL,
  `operator_label` VARCHAR(255) NOT NULL,
  `remark` TEXT NOT NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `transfers_check_0` CHECK (cards >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `migrations` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `agent_id` VARCHAR(80) NOT NULL,
  `from_region_id` VARCHAR(80) NOT NULL,
  `to_region_id` VARCHAR(80) NOT NULL,
  `service_id` VARCHAR(80),
  `operator_id` VARCHAR(80) NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `reason` TEXT NOT NULL,
  `tea_ids_json` JSON NOT NULL,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`from_region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`to_region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`operator_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `migrations_check_0` CHECK (from_region_id <> to_region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  `agent_id` VARCHAR(80) NOT NULL,
  `owner_id` VARCHAR(80),
  `creator_id` VARCHAR(80) NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `priority` VARCHAR(255) NOT NULL,
  `response_hours` INT NOT NULL DEFAULT 24,
  `resolve_days` INT NOT NULL DEFAULT 3,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`owner_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`creator_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX `tickets_region_id_owner_id_status_idx` (`region_id`, `owner_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `ticket_comments` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `ticket_id` VARCHAR(80) NOT NULL,
  `actor_label` VARCHAR(255) NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `creator_id` VARCHAR(80) NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `version` INT NOT NULL,
  FOREIGN KEY (`creator_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `announcements_check_0` CHECK (version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `announcement_regions` (
  `announcement_id` VARCHAR(80) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`announcement_id`, `region_id`),
  FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `owner_id` VARCHAR(80) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `source` VARCHAR(255) NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `regions_json` JSON NOT NULL,
  FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `data_tasks` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `owner_id` VARCHAR(80) NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `record_count` INT NOT NULL,
  `note` TEXT NOT NULL,
  FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `data_tasks_check_0` CHECK (record_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `data_task_regions` (
  `task_id` VARCHAR(80) NOT NULL,
  `region_id` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`task_id`, `region_id`),
  FOREIGN KEY (`task_id`) REFERENCES `data_tasks` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `access_records` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `owner_id` VARCHAR(80) NOT NULL,
  `event_date` VARCHAR(255) NOT NULL,
  `event_time` VARCHAR(255) NOT NULL,
  `result` VARCHAR(255) NOT NULL,
  `device` VARCHAR(255) NOT NULL,
  `source_label` VARCHAR(255) NOT NULL,
  `reason` TEXT NOT NULL,
  FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `audit` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `event_time` VARCHAR(255) NOT NULL,
  `actor_label` VARCHAR(255) NOT NULL,
  `account_label` VARCHAR(255) NOT NULL,
  `action` TEXT NOT NULL,
  `regions_json` JSON NOT NULL,
  INDEX `audit_event_time_idx` (`event_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `system_config` (
  `key` VARCHAR(80) PRIMARY KEY NOT NULL,
  `value_json` JSON NOT NULL,
  `version` INT NOT NULL,
  `updated_at` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `demo_snapshots` (
  `id` VARCHAR(80) PRIMARY KEY NOT NULL,
  `data_json` JSON NOT NULL,
  `revision` INT NOT NULL DEFAULT 0,
  `updated_at` VARCHAR(255) NOT NULL,
  CONSTRAINT `demo_snapshots_check_0` CHECK (revision >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `demo_seed_meta` (
  `key` VARCHAR(80) PRIMARY KEY NOT NULL,
  `value` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
