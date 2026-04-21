import { youtube } from '@/shared/lib/youtube-client';
import { isoDurationToSeconds } from '@/shared/lib/duration';

const MAX_YOUTUBE_BATCH_SIZE = 50;
const PLAYLIST_PAGE_SIZE = 20;
const MAX_PLAYLIST_FETCH_PAGES = 5;

type ThumbnailSet = {
  default?: { url?: string };
  medium?: { url?: string };
  high?: { url?: string };
  standard?: { url?: string };
  maxres?: { url?: string };
};

type PlaylistItemsListResponse = {
  items?: {
    contentDetails?: {
      videoId?: string;
    };
  }[];
  nextPageToken?: string;
};

type VideosListItem = {
  id?: string;
  contentDetails?: {
    duration?: string;
  };
  snippet?: {
    channelId?: string;
    description?: string;
    liveBroadcastContent?: string;
    publishedAt?: string;
    thumbnails?: ThumbnailSet;
    title?: string;
  };
};

type VideosListResponse = {
  items?: VideosListItem[];
};

type SearchListResponse = {
  items?: {
    id?: {
      videoId?: string;
    };
  }[];
  nextPageToken?: string;
};

export type VideoDetail = {
  videoId: string;
  channelId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  publishedAt: number;
};

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

function clampPlaylistPages(maxPages: number) {
  if (!Number.isFinite(maxPages)) {
    return 1;
  }

  return Math.max(1, Math.min(MAX_PLAYLIST_FETCH_PAGES, Math.trunc(maxPages)));
}

function pickBestThumbnailUrl(thumbnails?: ThumbnailSet) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null
  );
}

function parseYouTubeDate(value?: string) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function parseVideoDetail(item: VideosListItem): VideoDetail | null {
  const videoId = item.id?.trim();
  const snippet = item.snippet;
  const durationIso = item.contentDetails?.duration?.trim();
  const publishedAt = parseYouTubeDate(snippet?.publishedAt);
  const channelId = snippet?.channelId?.trim();

  if (!videoId || !durationIso || !publishedAt || !channelId) {
    return null;
  }

  const durationSeconds = isoDurationToSeconds(durationIso);

  if (snippet?.liveBroadcastContent === 'live' && durationSeconds === 0) {
    return null;
  }

  return {
    videoId,
    channelId,
    title: snippet?.title?.trim() || 'Vídeo sem título',
    description: snippet?.description?.trim() || null,
    thumbnailUrl: pickBestThumbnailUrl(snippet?.thumbnails),
    durationSeconds,
    publishedAt,
  };
}

export async function fetchLatestVideosOfPlaylist(
  playlistId: string,
  maxPages = 3,
): Promise<string[]> {
  const normalizedPlaylistId = playlistId.trim();

  if (!normalizedPlaylistId) {
    return [];
  }

  const videoIds: string[] = [];
  const seenVideoIds = new Set<string>();
  let nextPageToken: string | undefined;
  let page = 0;

  do {
    const searchParams: Record<string, string> = {
      playlistId: normalizedPlaylistId,
      part: 'contentDetails',
      maxResults: String(PLAYLIST_PAGE_SIZE),
    };

    if (nextPageToken) {
      searchParams.pageToken = nextPageToken;
    }

    const response = await youtube
      .get('playlistItems', { searchParams })
      .json<PlaylistItemsListResponse>();

    for (const item of response.items ?? []) {
      const videoId = item.contentDetails?.videoId?.trim();

      if (!videoId || seenVideoIds.has(videoId)) {
        continue;
      }

      seenVideoIds.add(videoId);
      videoIds.push(videoId);
    }

    nextPageToken = response.nextPageToken;
    page += 1;
  } while (nextPageToken && page < clampPlaylistPages(maxPages));

  return videoIds;
}

export async function fetchLatestVideosOfChannel(
  channelId: string,
  maxPages = 3,
): Promise<string[]> {
  const normalizedChannelId = channelId.trim();

  if (!normalizedChannelId) {
    return [];
  }

  const videoIds: string[] = [];
  const seenVideoIds = new Set<string>();
  let nextPageToken: string | undefined;
  let page = 0;

  do {
    const searchParams: Record<string, string> = {
      channelId: normalizedChannelId,
      part: 'id',
      type: 'video',
      order: 'date',
      maxResults: String(PLAYLIST_PAGE_SIZE),
    };

    if (nextPageToken) {
      searchParams.pageToken = nextPageToken;
    }

    const response = await youtube.get('search', { searchParams }).json<SearchListResponse>();

    for (const item of response.items ?? []) {
      const videoId = item.id?.videoId?.trim();

      if (!videoId || seenVideoIds.has(videoId)) {
        continue;
      }

      seenVideoIds.add(videoId);
      videoIds.push(videoId);
    }

    nextPageToken = response.nextPageToken;
    page += 1;
  } while (nextPageToken && page < clampPlaylistPages(maxPages));

  return videoIds;
}

export async function fetchVideoDetails(videoIds: string[]): Promise<VideoDetail[]> {
  const uniqueVideoIds = Array.from(new Set(videoIds.map((videoId) => videoId.trim()).filter(Boolean)));
  const details: VideoDetail[] = [];

  for (const batch of chunk(uniqueVideoIds, MAX_YOUTUBE_BATCH_SIZE)) {
    const response = await youtube
      .get('videos', {
        searchParams: {
          id: batch.join(','),
          part: 'contentDetails,snippet',
        },
      })
      .json<VideosListResponse>();

    for (const item of response.items ?? []) {
      const detail = parseVideoDetail(item);

      if (detail) {
        details.push(detail);
      }
    }
  }

  return details;
}

export async function fetchTrendingVideos(
  regionCode: string,
  maxResults = 25,
): Promise<VideoDetail[]> {
  const response = await youtube
    .get('videos', {
      searchParams: {
        chart: 'mostPopular',
        regionCode: regionCode.trim().toUpperCase() || 'BR',
        part: 'contentDetails,snippet',
        maxResults: String(Math.max(1, Math.min(MAX_YOUTUBE_BATCH_SIZE, Math.trunc(maxResults)))),
      },
    })
    .json<VideosListResponse>();

  return (response.items ?? []).map(parseVideoDetail).filter((item): item is VideoDetail => Boolean(item));
}
