jest.mock('@/db/client', () => ({
  db: {
    transaction: jest.fn((fn: (tx: unknown) => unknown) => {
      const tx = {
        update: jest.fn(() => ({
          set: jest.fn(() => ({ where: jest.fn(() => ({ run: jest.fn() })) })),
        })),
        insert: jest.fn(() => ({
          values: jest.fn(() => ({
            onConflictDoNothing: jest.fn(() => ({ run: jest.fn() })),
            run: jest.fn(),
          })),
        })),
      };
      return fn(tx);
    }),
  },
  schema: {
    jobRuns: {},
    subscriptions: {},
    settings: {},
    videos: { videoId: 'videoId' },
  },
}));

jest.mock('@/db/queries/settings');
jest.mock('@/db/queries/job-runs');
jest.mock('@/db/queries/subscriptions');
jest.mock('@/db/queries/videos');
jest.mock('@/features/subscriptions/api', () => ({
  fetchChannelsUploadsPlaylists: jest.fn(),
}));
jest.mock('@/features/videos/api', () => ({
  fetchLatestVideosOfPlaylist: jest.fn(),
  fetchLatestVideosOfChannel: jest.fn(),
  fetchTrendingVideos: jest.fn(),
  fetchVideoDetails: jest.fn(),
}));

import { getSettings } from '@/db/queries/settings';
import { startJobRun } from '@/db/queries/job-runs';
import { getSubscriptionsForJob } from '@/db/queries/subscriptions';
import { videoExists } from '@/db/queries/videos';
import {
  fetchLatestVideosOfPlaylist,
  fetchVideoDetails,
} from '@/features/videos/api';

import { runFetchVideosJob } from './fetch-videos-job';

const getSettingsMock = getSettings as jest.Mock;
const startJobRunMock = startJobRun as jest.Mock;
const getSubsForJobMock = getSubscriptionsForJob as jest.Mock;
const videoExistsMock = videoExists as jest.Mock;
const fetchPlaylistMock = fetchLatestVideosOfPlaylist as jest.Mock;
const fetchVideoDetailsMock = fetchVideoDetails as jest.Mock;

const baseSettings = {
  id: 1,
  maxSubsPerJob: 5,
  videosPerSub: 3,
  includeTrending: false,
  trendingRegionCode: 'BR',
  dailyTargetHours: 60,
  lastJobRunAt: null,
  minDurationSeconds: 181,
};

function makeSub(channelId: string) {
  return {
    channelId,
    uploadsPlaylistId: `PL${channelId}`,
    title: `Channel ${channelId}`,
    isActive: true,
    unsubscribedAt: null,
    lastFetchedAt: null,
    addedAt: Date.now(),
  };
}

function makeDetail(videoId: string, durationSeconds = 300) {
  return {
    videoId,
    channelId: 'ch1',
    title: `Video ${videoId}`,
    description: null,
    thumbnailUrl: null,
    durationSeconds,
    publishedAt: Date.now(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getSettingsMock.mockResolvedValue(baseSettings);
  startJobRunMock.mockResolvedValue(1);
  videoExistsMock.mockResolvedValue(false);
  fetchPlaylistMock.mockResolvedValue([]);
  fetchVideoDetailsMock.mockResolvedValue([]);
});

describe('runFetchVideosJob – subscription selection', () => {
  it('queries DB with maxSubsPerJob limit', async () => {
    getSubsForJobMock.mockResolvedValue([]);

    await runFetchVideosJob('manual');

    expect(getSubsForJobMock).toHaveBeenCalledWith(5);
  });

  it('does not call any fetch API when subscription list is empty', async () => {
    getSubsForJobMock.mockResolvedValue([]);

    const result = await runFetchVideosJob('manual');

    expect(fetchPlaylistMock).not.toHaveBeenCalled();
    expect(result.subsProcessed).toBe(0);
  });
});

describe('runFetchVideosJob – video deduplication', () => {
  it('skips inserting a video that already exists in the DB', async () => {
    getSubsForJobMock.mockResolvedValue([makeSub('ch1')]);
    fetchPlaylistMock.mockResolvedValue(['vid1', 'vid2']);
    videoExistsMock.mockResolvedValue(true);

    const result = await runFetchVideosJob('manual');

    expect(fetchVideoDetailsMock).not.toHaveBeenCalled();
    expect(result.videosAdded).toBe(0);
  });
});

describe('runFetchVideosJob – error isolation', () => {
  it('continues remaining subscriptions after one throws', async () => {
    getSubsForJobMock.mockResolvedValue([makeSub('ch1'), makeSub('ch2'), makeSub('ch3')]);
    fetchPlaylistMock
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue(['vidA']);
    fetchVideoDetailsMock.mockResolvedValue([makeDetail('vidA')]);

    const result = await runFetchVideosJob('manual');

    expect(result.errors).toHaveLength(1);
    expect(result.subsProcessed).toBe(2);
  });
});

describe('runFetchVideosJob – live stream filtering', () => {
  it('discards videos with durationSeconds === 0', async () => {
    getSubsForJobMock.mockResolvedValue([makeSub('ch1')]);
    fetchPlaylistMock.mockResolvedValue(['live1']);
    videoExistsMock.mockResolvedValue(false);
    fetchVideoDetailsMock.mockResolvedValue([makeDetail('live1', 0)]);

    const result = await runFetchVideosJob('manual');

    expect(result.videosAdded).toBe(0);
  });
});

describe('runFetchVideosJob – cancellation', () => {
  it('stops before processing the next subscription and keeps partial results', async () => {
    getSubsForJobMock.mockResolvedValue([makeSub('ch1'), makeSub('ch2')]);
    fetchPlaylistMock.mockResolvedValue(['vid1']);
    videoExistsMock.mockResolvedValue(false);
    fetchVideoDetailsMock.mockResolvedValue([makeDetail('vid1')]);

    let cancelled = false;

    const result = await runFetchVideosJob(
      'manual',
      (progress) => {
        if (progress.current === 1) {
          cancelled = true;
        }
      },
      () => cancelled,
    );

    expect(result.cancelled).toBe(true);
    expect(result.subsProcessed).toBe(1);
    expect(result.videosAdded).toBe(1);
    expect(fetchPlaylistMock).toHaveBeenCalledTimes(1);
  });
});
