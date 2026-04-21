import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import HomeScreen from '../../../app/(app)/(tabs)/index';

type FlashListProps = Record<string, unknown>;

let mockLatestFlashListProps: FlashListProps | null = null;

const mockPush = jest.fn();
const mockMutateAsync = jest.fn<
  Promise<{ cancelled: boolean; errors: string[]; subsProcessed: number; videosAdded: number }>,
  [string]
>().mockResolvedValue({
  cancelled: false,
  errors: [],
  subsProcessed: 0,
  videosAdded: 0,
});
const mockRefillPlan = jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined);
const mockCancel = jest.fn();

jest.mock('@shopify/flash-list', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    FlashList: (props: Record<string, unknown>) => {
      mockLatestFlashListProps = props;

      const data = Array.isArray(props.data) ? props.data : [];
      const renderItem =
        typeof props.renderItem === 'function'
          ? (props.renderItem as ({ item, index }: { item: unknown; index: number }) => React.ReactNode)
          : null;

      return (
        <View testID="flash-list">
          {props.ListHeaderComponent as React.ReactNode}
          {props.ListEmptyComponent as React.ReactNode}
          {renderItem ? data.map((item, index) => <View key={index}>{renderItem({ item, index })}</View>) : null}
        </View>
      );
    },
  };
});

jest.mock('lucide-react-native', () => ({
  RefreshCw: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    SafeAreaView: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
  };
});

jest.mock('drizzle-orm/expo-sqlite', () => ({
  useLiveQuery: jest.fn(() => ({
    data: [
      {
        dailyTargetHours: 60,
        id: 1,
        lastJobRunAt: 0,
        lastSubsSyncAt: 0,
      },
    ],
  })),
}));

jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({})),
        })),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(),
      })),
    })),
  },
  schema: {
    settings: {
      id: 'id',
    },
  },
}));

jest.mock('@/db/queries/daily-plan', () => ({
  useTodayPlan: jest.fn(() => ({
    data: {
      plan: {
        id: 1,
        targetMinutes: 60,
      },
      videos: [
        {
          channelId: 'channel-1',
          channelTitle: 'Canal',
          dailyPlanVideoId: 11,
          durationSeconds: 3600,
          source: 'subscription',
          thumbnailUrl: null,
          title: 'Video 1',
          videoId: 'video-1',
          watchedAt: null,
        },
      ],
    },
    isInitialLoading: false,
    isRefreshing: false,
  })),
}));

jest.mock('@/features/jobs/hooks', () => ({
  useRunJob: jest.fn(() => ({
    cancel: mockCancel,
    isCancelling: false,
    isPending: false,
    mutateAsync: mockMutateAsync,
    progress: null,
  })),
}));

jest.mock('@/features/jobs/components/JobProgressModal', () => ({
  JobProgressModal: () => null,
}));

jest.mock('@/features/timeline/actions', () => ({
  excludeVideo: jest.fn(),
  markAsWatched: jest.fn(),
  removeFromToday: jest.fn(),
}));

jest.mock('@/features/timeline/components/VideoCard', () => ({
  VideoCard: () => {
    const { View } = jest.requireActual<typeof import('react-native')>('react-native');
    return <View testID="video-card" />;
  },
}));

jest.mock('@/features/timeline/planner', () => ({
  getOrCreateTodayPlan: jest.fn(),
  getPlanMarginBounds: jest.fn(() => ({
    lower: 3000,
    upper: 4200,
  })),
  getTodayDateString: jest.fn(() => '2026-04-21'),
  refillPlan: mockRefillPlan,
}));

jest.mock('@/shared/lib/formatters', () => ({
  formatCalendarLabel: jest.fn(() => 'Hoje'),
  formatMinutes: jest.fn((minutes: number) => `${minutes}min`),
}));

jest.mock('@/shared/hooks/useRetainedLiveQueryData', () => ({
  useRetainedLiveQueryData: jest.fn((data: unknown) => ({
    data,
    hasResolvedOnce: data !== undefined,
    isInitialLoading: data === undefined,
    isRefreshing: false,
  })),
}));

jest.mock('@/shared/theme/provider', () => ({
  useAppTheme: jest.fn(() => ({
    theme: {
      accentSoft: '#ddd',
      background: '#fff',
      border: '#ccc',
      primary: '#00f',
      primarySoft: '#eef',
      success: '#0a0',
      surfaceAlt: '#f5f5f5',
      text: '#111',
      textMuted: '#666',
      textSoft: '#777',
    },
  })),
}));

jest.mock('@/shared/ui/buttons', () => ({
  PrimaryButton: ({ label, onPress }: { label: string; onPress: () => void }) => {
    const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <Pressable onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
  SecondaryButton: ({ label, onPress }: { label: string; onPress: () => void }) => {
    const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <Pressable onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/shared/ui/empty-state', () => ({
  EmptyState: ({ title }: { title: string }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return <Text>{title}</Text>;
  },
}));

jest.mock('@/shared/ui/layout', () => ({
  Panel: ({ children }: { children?: React.ReactNode }) => {
    const { View } = jest.requireActual<typeof import('react-native')>('react-native');
    return <View>{children}</View>;
  },
  Tag: ({ label }: { label: string }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return <Text>{label}</Text>;
  },
}));

jest.mock('@/shared/ui/skeleton', () => ({
  ListLoadingOverlay: () => null,
  SkeletonBlock: () => null,
  SkeletonText: () => null,
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockLatestFlashListProps = null;
    mockCancel.mockClear();
    mockMutateAsync.mockClear();
    mockPush.mockClear();
    mockRefillPlan.mockClear();
  });

  it('does not expose pull-to-refresh on the today list', () => {
    render(<HomeScreen />);

    expect(mockLatestFlashListProps).not.toBeNull();
    expect(mockLatestFlashListProps?.onRefresh).toBeUndefined();
    expect(mockLatestFlashListProps?.refreshing).toBeUndefined();
  });

  it('keeps manual synchronization behind the sync button', async () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByTestId('today-sync-button'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('manual');
    });
  });
});
