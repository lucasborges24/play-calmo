import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';

import { db, schema } from '@/db/client';
import type { Video } from '@/db/schema';

export type LibraryFilter = 'unwatched' | 'watched' | 'excluded';

export type LibraryVideo = Video & {
  channelThumbnailUrl: string | null;
  channelTitle: string;
};

type LibraryVideoRow = {
  channelThumbnailUrl: string | null;
  channelTitle: string;
  video: Video;
};

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function getLibraryFilterClause(filter: LibraryFilter) {
  switch (filter) {
    case 'unwatched':
      return and(isNull(schema.videos.watchedAt), isNull(schema.videos.excludedAt));
    case 'watched':
      return and(isNotNull(schema.videos.watchedAt), isNull(schema.videos.excludedAt));
    case 'excluded':
      return isNotNull(schema.videos.excludedAt);
  }
}

export function getLibraryVideos(filter: LibraryFilter) {
  const query = db
    .select({
      channelThumbnailUrl: schema.subscriptions.thumbnailUrl,
      channelTitle: schema.subscriptions.title,
      video: schema.videos,
    })
    .from(schema.videos)
    .innerJoin(schema.subscriptions, eq(schema.videos.channelId, schema.subscriptions.channelId))
    .where(getLibraryFilterClause(filter));

  switch (filter) {
    case 'unwatched':
      return query.orderBy(desc(schema.videos.addedAt));
    case 'watched':
      return query.orderBy(desc(schema.videos.watchedAt), desc(schema.videos.addedAt));
    case 'excluded':
      return query.orderBy(desc(schema.videos.excludedAt), desc(schema.videos.addedAt));
  }
}

export function mapLibraryVideos(rows: LibraryVideoRow[] | undefined): LibraryVideo[] {
  return (rows ?? []).map((row) => ({
    ...row.video,
    channelThumbnailUrl: row.channelThumbnailUrl,
    channelTitle: row.channelTitle,
  }));
}

export function filterLibraryVideos(videos: LibraryVideo[], search?: string): LibraryVideo[] {
  const normalizedSearch = normalizeSearchValue(search ?? '');

  if (!normalizedSearch) {
    return videos;
  }

  return videos.filter((video) => {
    const normalizedTitle = normalizeSearchValue(video.title);
    const normalizedChannelTitle = normalizeSearchValue(video.channelTitle);

    return (
      normalizedTitle.includes(normalizedSearch) ||
      normalizedChannelTitle.includes(normalizedSearch)
    );
  });
}
