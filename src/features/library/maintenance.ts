import { and, inArray, isNotNull, isNull, lt } from 'drizzle-orm';

import { db, schema } from '@/db/client';

const DAY_IN_MS = 86_400_000;

export function cleanOldWatched(days: number): number {
  const safeDays = Math.max(1, Math.floor(days));
  const cutoff = Date.now() - safeDays * DAY_IN_MS;

  const staleWatchedRows = db
    .select({ videoId: schema.videos.videoId })
    .from(schema.videos)
    .where(and(isNotNull(schema.videos.watchedAt), lt(schema.videos.watchedAt, cutoff)))
    .all();

  const staleVideoIds = staleWatchedRows.map((row) => row.videoId);

  if (staleVideoIds.length === 0) {
    return 0;
  }

  const activePlanRows = db
    .select({ videoId: schema.dailyPlanVideos.videoId })
    .from(schema.dailyPlanVideos)
    .where(
      and(
        inArray(schema.dailyPlanVideos.videoId, staleVideoIds),
        isNull(schema.dailyPlanVideos.removedAt),
      ),
    )
    .all();

  const protectedVideoIds = new Set(activePlanRows.map((row) => row.videoId));
  const deletableVideoIds = staleVideoIds.filter((videoId) => !protectedVideoIds.has(videoId));

  if (deletableVideoIds.length === 0) {
    return 0;
  }

  db.transaction((tx) => {
    tx
      .delete(schema.dailyPlanVideos)
      .where(inArray(schema.dailyPlanVideos.videoId, deletableVideoIds))
      .run();

    tx.delete(schema.videos).where(inArray(schema.videos.videoId, deletableVideoIds)).run();
  });

  return deletableVideoIds.length;
}
