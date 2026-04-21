CREATE TABLE `dailyPlanVideos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`video_id` text NOT NULL,
	`position` integer NOT NULL,
	`removed_at` integer,
	FOREIGN KEY (`plan_id`) REFERENCES `dailyPlans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`video_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dailyPlans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_date` text NOT NULL,
	`target_minutes` integer NOT NULL,
	`generated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dailyPlans_plan_date_unique` ON `dailyPlans` (`plan_date`);--> statement-breakpoint
CREATE TABLE `jobRuns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`trigger` text NOT NULL,
	`subs_processed` integer DEFAULT 0,
	`videos_added` integer DEFAULT 0,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` integer PRIMARY KEY NOT NULL,
	`google_user_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`access_token` text NOT NULL,
	`access_token_expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`daily_target_hours` integer DEFAULT 2 NOT NULL,
	`max_subs_per_job` integer DEFAULT 25 NOT NULL,
	`videos_per_sub` integer DEFAULT 5 NOT NULL,
	`include_trending` integer DEFAULT false NOT NULL,
	`trending_region_code` text DEFAULT 'BR' NOT NULL,
	`last_job_run_at` integer,
	`last_subs_sync_at` integer,
	`notifications_enabled` integer DEFAULT false NOT NULL,
	`notification_hour` integer DEFAULT 7 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`channel_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`thumbnail_url` text,
	`uploads_playlist_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_fetched_at` integer,
	`subscribed_at` integer,
	`unsubscribed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`video_id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`thumbnail_url` text,
	`duration_seconds` integer NOT NULL,
	`published_at` integer NOT NULL,
	`added_at` integer NOT NULL,
	`source` text NOT NULL,
	`watched_at` integer,
	`excluded_at` integer,
	FOREIGN KEY (`channel_id`) REFERENCES `subscriptions`(`channel_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos (watched_at, excluded_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos (channel_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos (published_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_subs_active ON subscriptions (is_active, last_fetched_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_dpv_plan ON dailyPlanVideos (plan_id);
