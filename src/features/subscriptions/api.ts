import { youtube } from '@/shared/lib/youtube-client';

const MAX_YOUTUBE_PAGE_SIZE = 50;

type ThumbnailSet = {
  default?: { url?: string };
  medium?: { url?: string };
  high?: { url?: string };
};

type SubscriptionsListResponse = {
  items?: {
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: ThumbnailSet;
      resourceId?: {
        channelId?: string;
      };
    };
  }[];
  nextPageToken?: string;
};

type ChannelsListResponse = {
  items?: {
    id?: string;
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }[];
};

export type YTSubscription = {
  channelId: string;
  title: string;
  thumbnailUrl: string | null;
  subscribedAt: number | null;
};

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

function pickBestThumbnailUrl(thumbnails?: ThumbnailSet) {
  return thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url ?? null;
}

function parseYouTubeDate(value?: string) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export async function fetchAllSubscriptionsFromYouTube(): Promise<YTSubscription[]> {
  const subscriptions: YTSubscription[] = [];
  let pageToken: string | undefined;

  do {
    const searchParams: Record<string, string> = {
      mine: 'true',
      part: 'snippet',
      maxResults: String(MAX_YOUTUBE_PAGE_SIZE),
    };

    if (pageToken) {
      searchParams.pageToken = pageToken;
    }

    const response = await youtube
      .get('subscriptions', { searchParams })
      .json<SubscriptionsListResponse>();

    for (const item of response.items ?? []) {
      const snippet = item.snippet;
      const channelId = snippet?.resourceId?.channelId?.trim();

      if (!channelId) {
        continue;
      }

      subscriptions.push({
        channelId,
        title: snippet?.title?.trim() || 'Canal sem nome',
        thumbnailUrl: pickBestThumbnailUrl(snippet?.thumbnails),
        subscribedAt: parseYouTubeDate(snippet?.publishedAt),
      });
    }

    pageToken = response.nextPageToken;
  } while (pageToken);

  return subscriptions;
}

export async function fetchChannelsUploadsPlaylists(
  channelIds: string[],
): Promise<Record<string, string>> {
  const uniqueChannelIds = Array.from(new Set(channelIds.map((channelId) => channelId.trim())));
  const uploadsByChannelId: Record<string, string> = {};

  for (const batch of chunk(uniqueChannelIds.filter(Boolean), MAX_YOUTUBE_PAGE_SIZE)) {
    const response = await youtube
      .get('channels', {
        searchParams: {
          id: batch.join(','),
          part: 'contentDetails,snippet',
          maxResults: String(MAX_YOUTUBE_PAGE_SIZE),
        },
      })
      .json<ChannelsListResponse>();

    for (const item of response.items ?? []) {
      const channelId = item.id?.trim();
      const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads?.trim();

      if (!channelId || !uploadsPlaylistId) {
        continue;
      }

      uploadsByChannelId[channelId] = uploadsPlaylistId;
    }
  }

  return uploadsByChannelId;
}
