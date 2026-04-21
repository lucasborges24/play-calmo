import { and, asc, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, schema } from '../client';
import type { DailyPlan, Video } from '../schema';
import { getTodayDateString } from '@/features/timeline/planner';
import { sortPlanVideos } from '@/features/timeline/sort-plan-videos';
import { useRetainedLiveQueryData } from '@/shared/hooks/useRetainedLiveQueryData';

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
        isNull(schema.videos.excludedAt),
      ),
    )
    .orderBy(asc(schema.dailyPlanVideos.position));
}

function getPlanVideoStateQuery(planId: number) {
  return db
    .select({
      videoId: schema.videos.videoId,
    })
    .from(schema.videos)
    .innerJoin(schema.dailyPlanVideos, eq(schema.dailyPlanVideos.videoId, schema.videos.videoId))
    .where(eq(schema.dailyPlanVideos.planId, planId))
    .limit(1);
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
  return sortPlanVideos(
    (rows ?? []).map((row) => ({
      ...row.video,
      channelTitle: row.channelTitle,
      dailyPlanVideoId: row.dailyPlanVideoId,
      position: row.position,
      removedAt: row.removedAt,
    })),
  );
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
  const { updatedAt: planVideoStateUpdatedAt } = useLiveQuery(
    getPlanVideoStateQuery(plan?.id ?? -1),
    [plan?.id],
  );
  const { data: videoRows } = useLiveQuery(getPlanVideosQuery(plan?.id ?? -1), [
    plan?.id,
    planVideoStateUpdatedAt?.getTime(),
  ]);
  const resolvedData =
    planRows === undefined || (plan !== null && videoRows === undefined)
      ? undefined
      : plan
        ? {
            plan,
            videos: mapPlanVideos(videoRows),
          }
        : null;
  const retainedData = useRetainedLiveQueryData(resolvedData);

  return {
    data: retainedData.data ?? null,
    hasResolvedOnce: retainedData.hasResolvedOnce,
    isInitialLoading: retainedData.isInitialLoading,
    isLoading: retainedData.isInitialLoading,
    isRefreshing: retainedData.isRefreshing,
  };
}
