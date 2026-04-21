import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';

import { db, schema } from '../client';
import type { NewVideo, Video } from '../schema';

export type VideoWithChannel = Video & {
  channelTitle: string;
};

function getVideosBaseQuery() {
  return db
    .select({
      channelTitle: schema.subscriptions.title,
      video: schema.videos,
    })
    .from(schema.videos)
    .innerJoin(schema.subscriptions, eq(schema.videos.channelId, schema.subscriptions.channelId));
}

function mapVideosWithChannel(
  rows:
    | {
        channelTitle: string;
        video: Video;
      }[]
    | undefined,
) {
  return (rows ?? []).map<VideoWithChannel>((row) => ({
    ...row.video,
    channelTitle: row.channelTitle,
  }));
}

export async function getUnwatchedVideos() {
  const rows = await getQueueVideosQuery();

  return mapVideosWithChannel(rows);
}

export async function getWatchedVideos() {
  const rows = await getWatchedVideosQuery();

  return mapVideosWithChannel(rows);
}

export async function getExcludedVideos() {
  const rows = await getExcludedVideosQuery();

  return mapVideosWithChannel(rows);
}

export function getQueueVideosQuery() {
  return getVideosBaseQuery()
    .where(and(isNull(schema.videos.watchedAt), isNull(schema.videos.excludedAt)))
    .orderBy(desc(schema.videos.addedAt));
}

export function getWatchedVideosQuery() {
  return getVideosBaseQuery()
    .where(isNotNull(schema.videos.watchedAt))
    .orderBy(desc(schema.videos.watchedAt));
}

export function getExcludedVideosQuery() {
  return getVideosBaseQuery()
    .where(isNotNull(schema.videos.excludedAt))
    .orderBy(desc(schema.videos.excludedAt));
}

export async function markVideoAsWatched(videoId: string) {
  await db
    .update(schema.videos)
    .set({ watchedAt: Date.now() })
    .where(eq(schema.videos.videoId, videoId));
}

export async function unmarkVideoAsWatched(videoId: string) {
  await db
    .update(schema.videos)
    .set({ watchedAt: null })
    .where(eq(schema.videos.videoId, videoId));
}

export async function excludeVideo(videoId: string) {
  await db
    .update(schema.videos)
    .set({ excludedAt: Date.now() })
    .where(eq(schema.videos.videoId, videoId));
}

export async function restoreExcludedVideo(videoId: string) {
  await db
    .update(schema.videos)
    .set({ excludedAt: null })
    .where(eq(schema.videos.videoId, videoId));
}

export async function videoExists(videoId: string) {
  const rows = await db
    .select({ videoId: schema.videos.videoId })
    .from(schema.videos)
    .where(eq(schema.videos.videoId, videoId))
    .limit(1);

  return rows.length > 0;
}

export async function insertVideos(rows: NewVideo[]) {
  if (rows.length === 0) {
    return;
  }

  await db
    .insert(schema.videos)
    .values(
      rows.map((row) => ({
        ...row,
        description: row.description ?? null,
        thumbnailUrl: row.thumbnailUrl ?? null,
        watchedAt: row.watchedAt ?? null,
        excludedAt: row.excludedAt ?? null,
      })),
    )
    .onConflictDoNothing({ target: schema.videos.videoId });
}
