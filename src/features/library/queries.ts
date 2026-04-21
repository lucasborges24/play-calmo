import { and, desc, eq, isNotNull, isNull, like, or } from 'drizzle-orm';

import { db, schema } from '@/db/client';
import type { Video } from '@/db/schema';

export type LibraryFilter = 'unwatched' | 'watched' | 'excluded';

export type LibraryVideo = Video & {
  channelTitle: string;
};

type LibraryVideoRow = {
  channelTitle: string;
  video: Video;
};

function getLibraryFilterClause(filter: LibraryFilter) {
  switch (filter) {
    case 'unwatched':
      return and(isNull(schema.videos.watchedAt), isNull(schema.videos.excludedAt));
    case 'watched':
      return isNotNull(schema.videos.watchedAt);
    case 'excluded':
      return isNotNull(schema.videos.excludedAt);
  }
}

function getLibrarySearchClause(search?: string) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return null;
  }

  const pattern = `%${trimmed}%`;

  return or(
    like(schema.videos.title, pattern),
    like(schema.subscriptions.title, pattern),
  );
}

export function getLibraryVideos(filter: LibraryFilter, search?: string) {
  const filterClause = getLibraryFilterClause(filter);
  const searchClause = getLibrarySearchClause(search);
  const whereClause = searchClause ? and(filterClause, searchClause) : filterClause;

  const query = db
    .select({
      channelTitle: schema.subscriptions.title,
      video: schema.videos,
    })
    .from(schema.videos)
    .innerJoin(schema.subscriptions, eq(schema.videos.channelId, schema.subscriptions.channelId))
    .where(whereClause);

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
    channelTitle: row.channelTitle,
  }));
}
