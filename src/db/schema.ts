import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const videoSources = ['subscription', 'trending'] as const;
export const jobRunTriggers = ['manual', 'background', 'foreground-catch-up'] as const;

export const session = sqliteTable('session', {
  id: integer('id').primaryKey(),
  googleUserId: text('google_user_id').notNull(),
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  accessToken: text('access_token').notNull(),
  accessTokenExpiresAt: integer('access_token_expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const subscriptions = sqliteTable('subscriptions', {
  channelId: text('channel_id').primaryKey(),
  title: text('title').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  uploadsPlaylistId: text('uploads_playlist_id').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastFetchedAt: integer('last_fetched_at'),
  subscribedAt: integer('subscribed_at'),
  unsubscribedAt: integer('unsubscribed_at'),
  createdAt: integer('created_at').notNull(),
});

export const videos = sqliteTable('videos', {
  videoId: text('video_id').primaryKey(),
  channelId: text('channel_id')
    .notNull()
    .references(() => subscriptions.channelId),
  title: text('title').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  durationSeconds: integer('duration_seconds').notNull(),
  publishedAt: integer('published_at').notNull(),
  addedAt: integer('added_at').notNull(),
  source: text('source', { enum: videoSources }).notNull(),
  watchedAt: integer('watched_at'),
  excludedAt: integer('excluded_at'),
});

export const dailyPlans = sqliteTable('dailyPlans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  planDate: text('plan_date').notNull().unique(),
  targetMinutes: integer('target_minutes').notNull(),
  generatedAt: integer('generated_at').notNull(),
});

export const dailyPlanVideos = sqliteTable('dailyPlanVideos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  planId: integer('plan_id')
    .notNull()
    .references(() => dailyPlans.id),
  videoId: text('video_id')
    .notNull()
    .references(() => videos.videoId),
  position: integer('position').notNull(),
  removedAt: integer('removed_at'),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  dailyTargetHours: integer('daily_target_hours').notNull().default(2),
  maxSubsPerJob: integer('max_subs_per_job').notNull().default(25),
  videosPerSub: integer('videos_per_sub').notNull().default(5),
  includeTrending: integer('include_trending', { mode: 'boolean' }).notNull().default(false),
  trendingRegionCode: text('trending_region_code').notNull().default('BR'),
  lastJobRunAt: integer('last_job_run_at'),
  lastSubsSyncAt: integer('last_subs_sync_at'),
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  notificationHour: integer('notification_hour').notNull().default(7),
});

export const jobRuns = sqliteTable('jobRuns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at').notNull(),
  finishedAt: integer('finished_at'),
  trigger: text('trigger', { enum: jobRunTriggers }).notNull(),
  subsProcessed: integer('subs_processed').default(0),
  videosAdded: integer('videos_added').default(0),
  errorMessage: text('error_message'),
});

export const subscriptionsRelations = relations(subscriptions, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ many, one }) => ({
  subscription: one(subscriptions, {
    fields: [videos.channelId],
    references: [subscriptions.channelId],
  }),
  planEntries: many(dailyPlanVideos),
}));

export const dailyPlansRelations = relations(dailyPlans, ({ many }) => ({
  videos: many(dailyPlanVideos),
}));

export const dailyPlanVideosRelations = relations(dailyPlanVideos, ({ one }) => ({
  plan: one(dailyPlans, {
    fields: [dailyPlanVideos.planId],
    references: [dailyPlans.id],
  }),
  video: one(videos, {
    fields: [dailyPlanVideos.videoId],
    references: [videos.videoId],
  }),
}));

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type DailyPlan = typeof dailyPlans.$inferSelect;
export type NewDailyPlan = typeof dailyPlans.$inferInsert;

export type DailyPlanVideo = typeof dailyPlanVideos.$inferSelect;
export type NewDailyPlanVideo = typeof dailyPlanVideos.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type JobRun = typeof jobRuns.$inferSelect;
export type NewJobRun = typeof jobRuns.$inferInsert;

export type VideoSource = (typeof videoSources)[number];
export type JobRunTrigger = (typeof jobRunTriggers)[number];
