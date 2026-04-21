import { eq } from 'drizzle-orm';
import { HTTPError } from 'ky';

import { db, schema } from '@/db/client';
import { startJobRun } from '@/db/queries/job-runs';
import { getSettings } from '@/db/queries/settings';
import { getSubscriptionsForJob } from '@/db/queries/subscriptions';
import { videoExists } from '@/db/queries/videos';
import type { NewVideo, Subscription } from '@/db/schema';
import { fetchChannelsUploadsPlaylists } from '@/features/subscriptions/api';
import {
  fetchLatestVideosOfChannel,
  fetchLatestVideosOfPlaylist,
  fetchTrendingVideos,
  fetchVideoDetails,
} from '@/features/videos/api';
import { warn as logWarn } from '@/shared/lib/logger';

export type JobTrigger = 'manual' | 'background' | 'foreground-catch-up';

type JobProgress = {
  current: number;
  total: number;
  videosAdded: number;
};

export type JobResult = {
  subsProcessed: number;
  videosAdded: number;
  errors: string[];
  cancelled: boolean;
};

class JobCancelledError extends Error {
  constructor() {
    super('Job cancelled');
    this.name = 'JobCancelledError';
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}

function normalizeVideoRows(rows: NewVideo[]) {
  return rows.map((row) => ({
    ...row,
    description: row.description ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    watchedAt: row.watchedAt ?? null,
    excludedAt: row.excludedAt ?? null,
  }));
}

function isPlaylistNotFoundError(error: unknown) {
  return error instanceof HTTPError && error.response.status === 404;
}

function isJobCancelledError(error: unknown): error is JobCancelledError {
  return error instanceof JobCancelledError;
}

function throwIfCancelled(shouldCancel?: () => boolean) {
  if (shouldCancel?.()) {
    throw new JobCancelledError();
  }
}

async function resolveCandidateIdsForSubscription(
  subscription: Pick<Subscription, 'channelId' | 'uploadsPlaylistId'>,
) {
  try {
    return await fetchLatestVideosOfPlaylist(subscription.uploadsPlaylistId, 3);
  } catch (error) {
    if (!isPlaylistNotFoundError(error)) {
      throw error;
    }

    logWarn('Uploads playlist returned 404, refreshing channel mapping', {
      channelId: subscription.channelId,
      uploadsPlaylistId: subscription.uploadsPlaylistId,
    });

    const refreshedUploadsPlaylistId = (
      await fetchChannelsUploadsPlaylists([subscription.channelId])
    )[subscription.channelId]?.trim();

    if (refreshedUploadsPlaylistId && refreshedUploadsPlaylistId !== subscription.uploadsPlaylistId) {
      await db
        .update(schema.subscriptions)
        .set({ uploadsPlaylistId: refreshedUploadsPlaylistId })
        .where(eq(schema.subscriptions.channelId, subscription.channelId));

      return fetchLatestVideosOfPlaylist(refreshedUploadsPlaylistId, 3);
    }

    logWarn('Uploads playlist still unavailable, falling back to channel search', {
      channelId: subscription.channelId,
    });

    return fetchLatestVideosOfChannel(subscription.channelId, 3);
  }
}

function finishJobRunLocally(
  id: number,
  params: {
    subsProcessed: number;
    videosAdded: number;
    errorMessage?: string;
    touchLastJobRunAt?: boolean;
  },
) {
  const finishedAt = Date.now();

  db.transaction((tx) => {
    tx
      .update(schema.jobRuns)
      .set({
        finishedAt,
        subsProcessed: params.subsProcessed,
        videosAdded: params.videosAdded,
        errorMessage: params.errorMessage ?? null,
      })
      .where(eq(schema.jobRuns.id, id))
      .run();

    if (params.touchLastJobRunAt) {
      tx.update(schema.settings).set({ lastJobRunAt: finishedAt }).where(eq(schema.settings.id, 1)).run();
    }
  });
}

export async function runFetchVideosJob(
  trigger: JobTrigger,
  onProgress?: (progress: JobProgress) => void,
  shouldCancel?: () => boolean,
): Promise<JobResult> {
  const settings = await getSettings();
  const runId = await startJobRun(trigger);
  const errors: string[] = [];
  let subsProcessed = 0;
  let totalVideosAdded = 0;

  try {
    const subs = await getSubscriptionsForJob(settings.maxSubsPerJob);
    const totalSteps = subs.length + (settings.includeTrending ? 1 : 0);

    onProgress?.({ current: 0, total: totalSteps, videosAdded: 0 });
    throwIfCancelled(shouldCancel);

    for (const [index, subscription] of subs.entries()) {
      let stepCompleted = false;

      throwIfCancelled(shouldCancel);

      try {
        const candidateIds = await resolveCandidateIdsForSubscription(subscription);
        throwIfCancelled(shouldCancel);
        const newIds: string[] = [];

        for (const videoId of candidateIds) {
          throwIfCancelled(shouldCancel);

          if (newIds.length >= settings.videosPerSub) {
            break;
          }

          if (!(await videoExists(videoId))) {
            newIds.push(videoId);
          }
        }

        throwIfCancelled(shouldCancel);
        const details = newIds.length > 0 ? await fetchVideoDetails(newIds) : [];
        throwIfCancelled(shouldCancel);
        const addedAt = Date.now();
        const rows = details
          .filter((detail) => detail.durationSeconds >= settings.minDurationSeconds)
          .map<NewVideo>((detail) => ({
            videoId: detail.videoId,
            channelId: subscription.channelId,
            title: detail.title,
            description: detail.description,
            thumbnailUrl: detail.thumbnailUrl,
            durationSeconds: detail.durationSeconds,
            publishedAt: detail.publishedAt,
            addedAt,
            source: 'subscription',
          }));

        throwIfCancelled(shouldCancel);
        db.transaction((tx) => {
          if (rows.length > 0) {
            tx
              .insert(schema.videos)
              .values(normalizeVideoRows(rows))
              .onConflictDoNothing({ target: schema.videos.videoId })
              .run();
          }

          tx
            .update(schema.subscriptions)
            .set({ lastFetchedAt: Date.now() })
            .where(eq(schema.subscriptions.channelId, subscription.channelId))
            .run();
        });

        totalVideosAdded += rows.length;
        subsProcessed += 1;
        stepCompleted = true;
      } catch (error) {
        if (isJobCancelledError(error)) {
          throw error;
        }

        const message = getErrorMessage(error);
        errors.push(`[${subscription.title}] ${message}`);
        logWarn('Subscription fetch job failed', { channelId: subscription.channelId, error: message });
        stepCompleted = true;
      } finally {
        if (stepCompleted) {
          onProgress?.({
            current: index + 1,
            total: totalSteps,
            videosAdded: totalVideosAdded,
          });
        }
      }
    }

    if (settings.includeTrending) {
      let stepCompleted = false;

      throwIfCancelled(shouldCancel);

      try {
        const [trending, knownSubscriptions] = await Promise.all([
          fetchTrendingVideos(settings.trendingRegionCode, 25),
          db.select({ channelId: schema.subscriptions.channelId }).from(schema.subscriptions),
        ]);
        throwIfCancelled(shouldCancel);
        const knownChannelIds = new Set(
          knownSubscriptions.map((subscription) => subscription.channelId),
        );
        const addedAt = Date.now();
        const rows: NewVideo[] = [];

        for (const video of trending) {
          throwIfCancelled(shouldCancel);

          if (video.durationSeconds < settings.minDurationSeconds) {
            continue;
          }

          if (!knownChannelIds.has(video.channelId)) {
            continue;
          }

          if (await videoExists(video.videoId)) {
            continue;
          }

          rows.push({
            videoId: video.videoId,
            channelId: video.channelId,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnailUrl,
            durationSeconds: video.durationSeconds,
            publishedAt: video.publishedAt,
            addedAt,
            source: 'trending',
          });
        }

        throwIfCancelled(shouldCancel);
        if (rows.length > 0) {
          db.transaction((tx) => {
            tx
              .insert(schema.videos)
              .values(normalizeVideoRows(rows))
              .onConflictDoNothing({ target: schema.videos.videoId })
              .run();
          });
        }

        totalVideosAdded += rows.length;
        stepCompleted = true;
      } catch (error) {
        if (isJobCancelledError(error)) {
          throw error;
        }

        const message = getErrorMessage(error);
        errors.push(`[trending] ${message}`);
        logWarn('Trending fetch job failed', { error: message });
        stepCompleted = true;
      } finally {
        if (stepCompleted) {
          onProgress?.({
            current: totalSteps,
            total: totalSteps,
            videosAdded: totalVideosAdded,
          });
        }
      }
    }

    finishJobRunLocally(runId, {
      subsProcessed,
      videosAdded: totalVideosAdded,
      errorMessage: errors.length > 0 ? errors.join(' | ').slice(0, 2_000) : undefined,
      touchLastJobRunAt: true,
    });

    return { subsProcessed, videosAdded: totalVideosAdded, errors, cancelled: false };
  } catch (error) {
    if (isJobCancelledError(error)) {
      finishJobRunLocally(runId, {
        subsProcessed,
        videosAdded: totalVideosAdded,
        touchLastJobRunAt: true,
      });

      return { subsProcessed, videosAdded: totalVideosAdded, errors, cancelled: true };
    }

    finishJobRunLocally(runId, {
      subsProcessed,
      videosAdded: totalVideosAdded,
      errorMessage: getErrorMessage(error),
    });

    throw error;
  }
}
