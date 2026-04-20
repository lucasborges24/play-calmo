import { and, asc, eq, isNull } from 'drizzle-orm';

import { db, schema } from '../client';

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function getTodayPlan() {
  const today = getTodayDateString();
  const plans = await db
    .select()
    .from(schema.dailyPlans)
    .where(eq(schema.dailyPlans.planDate, today))
    .limit(1);

  const plan = plans[0];

  if (!plan) {
    return null;
  }

  const videos = await db
    .select({
      dailyPlanVideo: schema.dailyPlanVideos,
      video: schema.videos,
    })
    .from(schema.dailyPlanVideos)
    .innerJoin(schema.videos, eq(schema.dailyPlanVideos.videoId, schema.videos.videoId))
    .where(
      and(
        eq(schema.dailyPlanVideos.planId, plan.id),
        isNull(schema.dailyPlanVideos.removedAt),
      ),
    )
    .orderBy(asc(schema.dailyPlanVideos.position));

  return { plan, videos };
}
