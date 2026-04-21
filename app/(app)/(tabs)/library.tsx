import { Ionicons } from '@expo/vector-icons';
import { useDeferredValue, useEffect, useState, useTransition } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlashList } from '@shopify/flash-list';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactVideoCard, type CompactVideoAction } from '@/features/library/components/CompactVideoCard';
import {
  getLibraryVideos,
  mapLibraryVideos,
  type LibraryFilter,
  type LibraryVideo,
} from '@/features/library/queries';
import { excludeVideo, markAsWatched, restoreExcludedVideo, unmarkAsWatched } from '@/features/timeline/actions';
import { useRetainedLiveQueryData } from '@/shared/hooks/useRetainedLiveQueryData';
import { useAppTheme } from '@/shared/theme/provider';
import { EmptyState } from '@/shared/ui/empty-state';
import { Panel, ScreenHeader } from '@/shared/ui/layout';
import { ListLoadingOverlay, SkeletonBlock, SkeletonText } from '@/shared/ui/skeleton';
import { SegmentedControl } from '@/shared/ui/segmented-control';

const SEGMENTS = [
  { label: 'Não assistidos', value: 'unwatched' },
  { label: 'Assistidos', value: 'watched' },
  { label: 'Excluídos', value: 'excluded' },
] as const;

const COPY_BY_FILTER: Record<
  LibraryFilter,
  {
    countLabel: string;
    emptyDescription: string;
    emptyIcon: React.ComponentProps<typeof Ionicons>['name'];
    emptyTitle: string;
    subtitle: string;
  }
> = {
  unwatched: {
    countLabel: 'Não assistidos',
    emptyDescription: 'Vídeos elegíveis para voltar ao seu radar aparecem aqui.',
    emptyIcon: 'time-outline',
    emptyTitle: 'Nada pendente',
    subtitle: 'Vídeos ainda candidatos para a sua curadoria local.',
  },
  watched: {
    countLabel: 'Assistidos',
    emptyDescription: 'Tudo o que você marcou como visto fica guardado nesta aba.',
    emptyIcon: 'checkmark-circle-outline',
    emptyTitle: 'Nada assistido ainda',
    subtitle: 'Histórico local do que já cumpriu o papel no seu dia.',
  },
  excluded: {
    countLabel: 'Excluídos',
    emptyDescription: 'Itens escondidos continuam disponíveis para restauração por aqui.',
    emptyIcon: 'eye-off-outline',
    emptyTitle: 'Nada excluído',
    subtitle: 'Conteúdos retirados da seleção, mas ainda recuperáveis.',
  },
};

type LibrarySkeletonItem = {
  key: string;
  kind: 'skeleton';
};

type ResolvedLibraryData = {
  filter: LibraryFilter;
  rows: NonNullable<Parameters<typeof mapLibraryVideos>[0]>;
  search: string;
};

const LIBRARY_SKELETON_ITEMS: LibrarySkeletonItem[] = Array.from({ length: 5 }, (_, index) => ({
  key: `library-skeleton-${index}`,
  kind: 'skeleton',
}));

function CountBadgeSkeleton() {
  const { theme } = useAppTheme();

  return (
    <View
      className="items-center justify-center rounded-[20px] px-4 py-3"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
      }}
    >
      <SkeletonBlock borderRadius={999} height={10} width={88} />
      <SkeletonBlock borderRadius={999} height={24} style={{ marginTop: 8 }} width={36} />
    </View>
  );
}

function LibraryCardSkeleton() {
  const { theme } = useAppTheme();

  return (
    <Panel style={{ padding: 12 }}>
      <View className="flex-row gap-3">
        <SkeletonBlock borderRadius={16} height={64} width={112} />

        <View className="flex-1 justify-between" style={{ minHeight: 64 }}>
          <SkeletonText lineHeight={12} lines={2} widths={['100%', '84%']} />

          <View className="flex-row items-center justify-between gap-2">
            <SkeletonBlock borderRadius={999} height={10} width="44%" />
            <SkeletonBlock borderRadius={999} height={20} width={84} />
          </View>
        </View>

        <View
          className="items-center justify-center rounded-full"
          style={{
            alignSelf: 'center',
            backgroundColor: theme.surfaceAlt,
            height: 32,
            width: 32,
          }}
        >
          <SkeletonBlock borderRadius={999} height={16} width={16} />
        </View>
      </View>
    </Panel>
  );
}

export default function LibraryScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<LibraryFilter>('unwatched');
  const [appliedFilter, setAppliedFilter] = useState<LibraryFilter>('unwatched');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const deferredSearch = useDeferredValue(debouncedSearch);
  const [isFilterPending, startFilterTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const { data: libraryRows } = useLiveQuery(
    getLibraryVideos(appliedFilter, deferredSearch),
    [appliedFilter, deferredSearch],
  );
  const retainedLibrary = useRetainedLiveQueryData<ResolvedLibraryData>(
    libraryRows === undefined
      ? undefined
      : {
          filter: appliedFilter,
          rows: libraryRows,
          search: deferredSearch,
        },
  );
  const displayFilter = retainedLibrary.data?.filter ?? appliedFilter;
  const displaySearch = retainedLibrary.data?.search ?? deferredSearch;
  const videos = mapLibraryVideos(retainedLibrary.data?.rows);
  const copy = COPY_BY_FILTER[displayFilter];
  const hasSearch = displaySearch.length > 0;
  const isInitialLoading = retainedLibrary.isInitialLoading;
  const showLoadingOverlay =
    !isInitialLoading &&
    (retainedLibrary.isRefreshing ||
      displayFilter !== filter ||
      displaySearch !== debouncedSearch ||
      isFilterPending);

  const handleMarkWatched = async (videoId: string) => {
    try {
      await markAsWatched(videoId);
    } catch (error) {
      Alert.alert('Não foi possível marcar como visto.', 'Tente novamente.');
      throw error;
    }
  };

  const handleExclude = async (videoId: string) => {
    try {
      await excludeVideo(videoId);
    } catch (error) {
      Alert.alert('Não foi possível excluir o vídeo.', 'Tente novamente.');
      throw error;
    }
  };

  const handleUnmarkWatched = async (videoId: string) => {
    try {
      await unmarkAsWatched(videoId);
    } catch (error) {
      Alert.alert('Não foi possível desfazer o visto.', 'Tente novamente.');
      throw error;
    }
  };

  const handleRestore = async (videoId: string) => {
    try {
      await restoreExcludedVideo(videoId);
    } catch (error) {
      Alert.alert('Não foi possível restaurar o vídeo.', 'Tente novamente.');
      throw error;
    }
  };

  const getActionsForVideo = (video: LibraryVideo): CompactVideoAction[] => {
    switch (displayFilter) {
      case 'unwatched':
        return [
          {
            icon: 'checkmark-outline',
            key: 'mark-watched',
            label: 'Marcar como visto',
            loadingLabel: 'Marcando como visto...',
            onPress: () => handleMarkWatched(video.videoId),
          },
          {
            destructive: true,
            icon: 'trash-outline',
            key: 'exclude',
            label: 'Excluir',
            loadingLabel: 'Excluindo...',
            onPress: () => handleExclude(video.videoId),
          },
        ];
      case 'watched':
        return [
          {
            icon: 'return-up-back-outline',
            key: 'unmark-watched',
            label: 'Desmarcar visto',
            loadingLabel: 'Desmarcando...',
            onPress: () => handleUnmarkWatched(video.videoId),
          },
        ];
      case 'excluded':
        return [
          {
            icon: 'refresh-outline',
            key: 'restore',
            label: 'Restaurar',
            loadingLabel: 'Restaurando...',
            onPress: () => handleRestore(video.videoId),
          },
        ];
    }
  };

  const handleFilterChange = (nextFilter: LibraryFilter) => {
    if (nextFilter === filter) {
      return;
    }

    setFilter(nextFilter);
    startFilterTransition(() => {
      setAppliedFilter(nextFilter);
    });
  };

  const listData: Array<LibraryVideo | LibrarySkeletonItem> = isInitialLoading
    ? LIBRARY_SKELETON_ITEMS
    : videos;

  return (
    <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: theme.background, flex: 1 }}>
      <View style={{ backgroundColor: theme.background, flex: 1, position: 'relative' }}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={{
              backgroundColor: theme.primarySoft,
              borderRadius: 180,
              height: 180,
              position: 'absolute',
              right: -60,
              top: -20,
              width: 180,
            }}
          />
          <View
            style={{
              backgroundColor: theme.accentSoft,
              borderRadius: 160,
              height: 160,
              left: -70,
              position: 'absolute',
              top: 140,
              width: 160,
            }}
          />
        </View>

        <FlashList
          contentContainerStyle={{
            paddingBottom: insets.bottom + 116,
            paddingHorizontal: 20,
            paddingTop: insets.top + 14,
          }}
          data={listData}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          keyExtractor={(item) => ('kind' in item ? item.key : item.videoId)}
          ListEmptyComponent={
            isInitialLoading ? null : (
              <View style={{ paddingTop: 8 }}>
                <EmptyState
                  description={
                    hasSearch
                      ? `Nenhum vídeo encontrado para "${displaySearch}".`
                      : copy.emptyDescription
                  }
                  icon={hasSearch ? 'search-outline' : copy.emptyIcon}
                  title={hasSearch ? 'Nada encontrado' : copy.emptyTitle}
                />
              </View>
            )
          }
          ListHeaderComponent={
            <View style={{ gap: 18, paddingBottom: 18 }}>
              <ScreenHeader
                eyebrow="Biblioteca"
                subtitle={copy.subtitle}
                title="Revise tudo o que já passou pela sua curadoria."
                trailing={
                  isInitialLoading ? (
                    <CountBadgeSkeleton />
                  ) : (
                    <View
                      className="items-center justify-center rounded-[20px] px-4 py-3"
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        className="text-center text-[11px] font-bold uppercase tracking-[1.5px]"
                        style={{ color: theme.textSoft }}
                      >
                        {copy.countLabel}
                      </Text>
                      <Text className="mt-1 text-[20px] font-extrabold" style={{ color: theme.text }}>
                        {videos.length}
                      </Text>
                    </View>
                  )
                }
              />

              <Panel style={{ gap: 14 }}>
                <SegmentedControl options={SEGMENTS} onChange={handleFilterChange} value={filter} />

                <View
                  className="flex-row items-center gap-3 rounded-[20px] px-4 py-3"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.border,
                    borderWidth: 1,
                  }}
                >
                  <Ionicons color={theme.textMuted} name="search-outline" size={18} />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 text-[15px]"
                    onChangeText={setSearch}
                    placeholder="Buscar por título ou canal"
                    placeholderTextColor={theme.textMuted}
                    style={{ color: theme.text }}
                    value={search}
                  />
                  {search.length > 0 ? (
                    <Ionicons
                      color={theme.textMuted}
                      name="close-circle"
                      onPress={() => setSearch('')}
                      size={18}
                    />
                  ) : null}
                </View>

                <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                  {showLoadingOverlay
                    ? 'Atualizando resultados sem limpar a lista atual.'
                    : 'Filtro em tempo real com debounce de 300 ms para título e canal.'}
                </Text>
              </Panel>
            </View>
          }
          renderItem={({ item }) =>
            'kind' in item ? (
              <LibraryCardSkeleton />
            ) : (
              <CompactVideoCard actions={getActionsForVideo(item)} status={displayFilter} video={item} />
            )
          }
          showsVerticalScrollIndicator={false}
        />

        {showLoadingOverlay ? <ListLoadingOverlay label="Atualizando resultados" /> : null}
      </View>
    </SafeAreaView>
  );
}
