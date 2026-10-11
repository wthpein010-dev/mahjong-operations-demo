CREATE TABLE `access_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`event_date` text NOT NULL,
	`event_time` text NOT NULL,
	`result` text NOT NULL,
	`device` text NOT NULL,
	`source_label` text NOT NULL,
	`reason` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`account` text NOT NULL,
	`game_id` text NOT NULL,
	`region_id` text NOT NULL,
	`service_id` text,
	`creator_label` text NOT NULL,
	`performance_owner` text NOT NULL,
	`status` text NOT NULL,
	`tea_quota` integer NOT NULL,
	`tier` text NOT NULL,
	`cards` integer NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "agents_check_0" CHECK("agents"."tea_quota" >= 0),
	CONSTRAINT "agents_check_1" CHECK("agents"."cards" >= 0),
	CONSTRAINT "agents_check_2" CHECK("agents"."performance_owner" IN ('company','region'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_account_unique` ON `agents` (`account`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_game_id_unique` ON `agents` (`game_id`);--> statement-breakpoint
CREATE INDEX `agents_region_id_service_id_idx` ON `agents` (`region_id`,`service_id`);--> statement-breakpoint
CREATE TABLE `announcement_regions` (
	`announcement_id` text NOT NULL,
	`region_id` text NOT NULL,
	PRIMARY KEY(`announcement_id`, `region_id`),
	FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`creator_id` text NOT NULL,
	`event_date` text NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `backend_accounts`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "announcements_check_0" CHECK("announcements"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`event_time` text NOT NULL,
	`actor_label` text NOT NULL,
	`account_label` text NOT NULL,
	`action` text NOT NULL,
	`regions_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_event_time_idx` ON `audit` (`event_time`);--> statement-breakpoint
CREATE TABLE `backend_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`login_account` text NOT NULL,
	`display_name` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text DEFAULT '2026-10-11T00:00:00.000Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `backend_accounts_login_account_unique` ON `backend_accounts` (`login_account`);--> statement-breakpoint
CREATE TABLE `charges` (
	`id` text PRIMARY KEY NOT NULL,
	`event_date` text NOT NULL,
	`region_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`tea_id` text,
	`player_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`service_id` text,
	`reward_rate_bps` integer NOT NULL,
	`performance_owner` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`tea_id`) REFERENCES `tea_houses`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "charges_check_0" CHECK("charges"."amount_cents" >= 0),
	CONSTRAINT "charges_check_1" CHECK("charges"."reward_rate_bps" >= 0 AND "charges"."reward_rate_bps" <= 2000)
);
--> statement-breakpoint
CREATE INDEX `charges_region_id_event_date_idx` ON `charges` (`region_id`,`event_date`);--> statement-breakpoint
CREATE TABLE `data_task_regions` (
	`task_id` text NOT NULL,
	`region_id` text NOT NULL,
	PRIMARY KEY(`task_id`, `region_id`),
	FOREIGN KEY (`task_id`) REFERENCES `data_tasks`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `data_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`event_date` text NOT NULL,
	`status` text NOT NULL,
	`record_count` integer NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "data_tasks_check_0" CHECK("data_tasks"."record_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE `demo_seed_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `demo_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`data_json` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "demo_snapshots_check_0" CHECK("demo_snapshots"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE `manager_regions` (
	`manager_id` text NOT NULL,
	`region_id` text NOT NULL,
	PRIMARY KEY(`manager_id`, `region_id`),
	FOREIGN KEY (`manager_id`) REFERENCES `managers`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manager_regions_region_id_unique` ON `manager_regions` (`region_id`);--> statement-breakpoint
CREATE TABLE `managers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`account` text NOT NULL,
	`game_id` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `backend_accounts`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `managers_account_unique` ON `managers` (`account`);--> statement-breakpoint
CREATE UNIQUE INDEX `managers_game_id_unique` ON `managers` (`game_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`event_date` text NOT NULL,
	`regions_json` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `backend_accounts`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `migrations` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`from_region_id` text NOT NULL,
	`to_region_id` text NOT NULL,
	`service_id` text,
	`operator_id` text NOT NULL,
	`event_date` text NOT NULL,
	`reason` text NOT NULL,
	`tea_ids_json` text NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`from_region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`to_region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`operator_id`) REFERENCES `backend_accounts`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "migrations_check_0" CHECK("migrations"."from_region_id" <> "migrations"."to_region_id")
);
--> statement-breakpoint
CREATE TABLE `player_tea_memberships` (
	`player_id` text NOT NULL,
	`tea_id` text NOT NULL,
	PRIMARY KEY(`player_id`, `tea_id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`tea_id`) REFERENCES `tea_houses`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`charge_id` text NOT NULL,
	`event_date` text NOT NULL,
	`region_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`charge_id`) REFERENCES `charges`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "refunds_check_0" CHECK("refunds"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_charge_id_unique` ON `refunds` (`charge_id`);--> statement-breakpoint
CREATE INDEX `refunds_region_id_event_date_idx` ON `refunds` (`region_id`,`event_date`);--> statement-breakpoint
CREATE TABLE `regions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`wechat` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text DEFAULT '2026-10-11T00:00:00.000Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`charge_id` text NOT NULL,
	`refund_id` text,
	`service_id` text NOT NULL,
	`region_id` text NOT NULL,
	`event_date` text NOT NULL,
	`kind` text NOT NULL,
	`base_cents` integer NOT NULL,
	`rate_bps` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`charge_id`) REFERENCES `charges`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`refund_id`) REFERENCES `refunds`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "rewards_check_0" CHECK("rewards"."base_cents" >= 0),
	CONSTRAINT "rewards_check_1" CHECK("rewards"."rate_bps" >= 0 AND "rewards"."rate_bps" <= 2000),
	CONSTRAINT "rewards_check_2" CHECK("rewards"."kind" IN ('accrual','refund_reversal')),
	CONSTRAINT "rewards_check_3" CHECK(("rewards"."kind" = 'accrual' AND "rewards"."amount_cents" >= 0 AND "rewards"."refund_id" IS NULL) OR ("rewards"."kind" = 'refund_reversal' AND "rewards"."amount_cents" <= 0 AND "rewards"."refund_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `rewards_service_id_event_date_idx` ON `rewards` (`service_id`,`event_date`);--> statement-breakpoint
CREATE TABLE `room_players` (
	`room_id` text NOT NULL,
	`player_id` text NOT NULL,
	PRIMARY KEY(`room_id`, `player_id`),
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`event_date` text NOT NULL,
	`region_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`tea_id` text NOT NULL,
	`game` text NOT NULL,
	`status` text NOT NULL,
	`rounds` integer NOT NULL,
	`cards` integer NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`tea_id`) REFERENCES `tea_houses`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "rooms_check_0" CHECK("rooms"."rounds" >= 0),
	CONSTRAINT "rooms_check_1" CHECK("rooms"."cards" >= 0)
);
--> statement-breakpoint
CREATE INDEX `rooms_region_id_event_date_idx` ON `rooms` (`region_id`,`event_date`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`account` text NOT NULL,
	`game_id` text NOT NULL,
	`type` text NOT NULL,
	`region_id` text,
	`reward_rate_bps` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `backend_accounts`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "services_check_0" CHECK("services"."reward_rate_bps" >= 0 AND "services"."reward_rate_bps" <= 2000),
	CONSTRAINT "services_check_1" CHECK(("services"."type" = '总部客服' AND "services"."region_id" IS NULL) OR ("services"."type" = '区域客服' AND "services"."region_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_account_unique` ON `services` (`account`);--> statement-breakpoint
CREATE UNIQUE INDEX `services_game_id_unique` ON `services` (`game_id`);--> statement-breakpoint
CREATE TABLE `system_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tea_houses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`agent_id` text NOT NULL,
	`region_id` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `tea_houses_region_id_agent_id_idx` ON `tea_houses` (`region_id`,`agent_id`);--> statement-breakpoint
CREATE TABLE `ticket_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`actor_label` text NOT NULL,
	`event_date` text NOT NULL,
	`body` text NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`region_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`owner_id` text,
	`creator_id` text NOT NULL,
	`event_date` text NOT NULL,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`response_hours` integer DEFAULT 24 NOT NULL,
	`resolve_days` integer DEFAULT 3 NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`owner_id`) REFERENCES `services`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`creator_id`) REFERENCES `backend_accounts`(`id`) ON UPDATE restrict ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `tickets_region_id_owner_id_status_idx` ON `tickets` (`region_id`,`owner_id`,`status`);--> statement-breakpoint
CREATE TABLE `transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`event_date` text NOT NULL,
	`region_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`game_id` text NOT NULL,
	`from_label` text NOT NULL,
	`to_label` text NOT NULL,
	`cards` integer NOT NULL,
	`operator_label` text NOT NULL,
	`remark` text NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE restrict ON DELETE restrict,
	CONSTRAINT "transfers_check_0" CHECK("transfers"."cards" >= 0)
);
