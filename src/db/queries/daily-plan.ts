import { and, asc, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, schema } from '../client';
import type { DailyPlan, Video } from '../schema';
import { getTodayDateString } from '@/features/timeline/planner';

export type VideoWithPosition = Video & {
  channelTitle: string;
  dailyPlanVideoId: number;
  position: number;
  removedAt: number | null;
};

function getTodayPlanQuery(dateStr: string) {
  return db
    .select()
    .from(schema.dailyPlans)
    .where(eq(schema.dailyPlans.planDate, dateStr))
    .limit(1);
}

function getPlanVideosQuery(planId: number) {
  return db
    .select({
      channelTitle: schema.subscriptions.title,
      dailyPlanVideoId: schema.dailyPlanVideos.id,
      position: schema.dailyPlanVideos.position,
      removedAt: schema.dailyPlanVideos.removedAt,
      video: schema.videos,
    })
    .from(schema.dailyPlanVideos)
    .innerJoin(schema.videos, eq(schema.dailyPlanVideos.videoId, schema.videos.videoId))
    .innerJoin(schema.subscriptions, eq(schema.videos.channelId, schema.subscriptions.channelId))
    .where(
      and(
        eq(schema.dailyPlanVideos.planId, planId),
        isNull(schema.dailyPlanVideos.removedAt),
        isNull(schema.videos.watchedAt),
        isNull(schema.videos.excludedAt),
      ),
    )
    .orderBy(asc(schema.dailyPlanVideos.position));
}

function mapPlanVideos(
  rows:
    | {
        channelTitle: string;
        dailyPlanVideoId: number;
        position: number;
        removedAt: number | null;
        video: Video;
      }[]
    | undefined,
): VideoWithPosition[] {
  return (rows ?? []).map((row) => ({
    ...row.video,
    channelTitle: row.channelTitle,
    dailyPlanVideoId: row.dailyPlanVideoId,
    position: row.position,
    removedAt: row.removedAt,
  }));
}

export async function getTodayPlan(
  dateStr = getTodayDateString(),
): Promise<{ plan: DailyPlan; videos: VideoWithPosition[] } | null> {
  const plans = await getTodayPlanQuery(dateStr);
  const plan = plans[0];

  if (!plan) {
    return null;
  }

  const videoRows = await getPlanVideosQuery(plan.id);

  return { plan, videos: mapPlanVideos(videoRows) };
}

export function useTodayPlan(dateStr = getTodayDateString()) {
  const { data: planRows } = useLiveQuery(getTodayPlanQuery(dateStr), [dateStr]);
  const plan = planRows?.[0] ?? null;
  const { data: videoRows } = useLiveQuery(getPlanVideosQuery(plan?.id ?? -1), [plan?.id]);

  return {
    data: plan
      ? {
          plan,
          videos: mapPlanVideos(videoRows),
        }
      : null,
    isLoading: planRows === undefined || (plan !== null && videoRows === undefined),
  };
}
