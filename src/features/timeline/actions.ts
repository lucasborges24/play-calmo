import { and, eq } from 'drizzle-orm';

import { db, schema } from '@/db/client';

import { getTodayDateString, refillPlan } from './planner';

export async function markAsWatched(videoId: string): Promise<void> {
  await db
    .update(schema.videos)
    .set({ watchedAt: Date.now() })
    .where(eq(schema.videos.videoId, videoId));
}

export async function unmarkAsWatched(videoId: string): Promise<void> {
  await db.update(schema.videos).set({ watchedAt: null }).where(eq(schema.videos.videoId, videoId));
}

export async function excludeVideo(videoId: string): Promise<void> {
  await db
    .update(schema.videos)
    .set({ excludedAt: Date.now() })
    .where(eq(schema.videos.videoId, videoId));
}

export async function restoreExcludedVideo(videoId: string): Promise<void> {
  await db
    .update(schema.videos)
    .set({ excludedAt: null })
    .where(eq(schema.videos.videoId, videoId));
}

export async function removeFromToday(videoId: string): Promise<void> {
  const today = getTodayDateString();
  const plans = await db
    .select({ id: schema.dailyPlans.id })
    .from(schema.dailyPlans)
    .where(eq(schema.dailyPlans.planDate, today))
    .limit(1);
  const plan = plans[0];

  if (!plan) {
    return;
  }

  await db
    .update(schema.dailyPlanVideos)
    .set({ removedAt: Date.now() })
    .where(
      and(
        eq(schema.dailyPlanVideos.planId, plan.id),
        eq(schema.dailyPlanVideos.videoId, videoId),
      ),
    );

  await refillPlan(plan.id);
}
