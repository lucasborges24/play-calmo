import { Ionicons } from '@expo/vector-icons';
import { useDeferredValue, useRef, useState, useTransition } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlashList } from '@shopify/flash-list';
import type { FlashListRef } from '@shopify/flash-list';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactVideoCard, type CompactVideoAction } from '@/features/library/components/CompactVideoCard';
import {
  filterLibraryVideos,
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
import { ScrollToTopButton, useScrollToTopButtonVisibility } from '@/shared/ui/scroll-to-top-button';
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
    helperText: string;
  }
> = {
  unwatched: {
    countLabel: 'Não assistidos',
    emptyDescription: 'Vídeos elegíveis para voltar ao seu radar aparecem aqui.',
    emptyIcon: 'time-outline',
    emptyTitle: 'Nada pendente',
    helperText: 'Itens que ainda precisam de uma decisão na sua curadoria.',
    subtitle: 'Vídeos ainda ativos na sua fila de curadoria.',
  },
  watched: {
    countLabel: 'Assistidos',
    emptyDescription: 'Tudo o que você marcou como visto fica guardado nesta aba.',
    emptyIcon: 'checkmark-circle-outline',
    emptyTitle: 'Nada assistido ainda',
    helperText: 'Seu histórico local do que já foi visto e pode servir de referência.',
    subtitle: 'Tudo o que já cumpriu o papel na sua seleção.',
  },
  excluded: {
    countLabel: 'Excluídos',
    emptyDescription: 'Itens escondidos continuam disponíveis para restauração por aqui.',
    emptyIcon: 'eye-off-outline',
    emptyTitle: 'Nada excluído',
    helperText: 'Conteúdos retirados da fila principal, mas ainda recuperáveis.',
    subtitle: 'Conteúdos removidos da seleção ativa, mas ainda acessíveis.',
  },
};

type LibrarySkeletonItem = {
  key: string;
  kind: 'skeleton';
};

type ResolvedLibraryData = {
  filter: LibraryFilter;
  rows: NonNullable<Parameters<typeof mapLibraryVideos>[0]>;
};

const LIBRARY_SKELETON_ITEMS: LibrarySkeletonItem[] = Array.from({ length: 5 }, (_, index) => ({
  key: `library-skeleton-${index}`,
  kind: 'skeleton',
}));

function CountBadgeSkeleton() {
  const { theme } = useAppTheme();

  return (
    <View
      className="items-center justify-center px-4 py-3"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderRadius: 16,
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
    <Panel
      style={{
        borderRadius: 16,
        elevation: 3,
        padding: 14,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: theme.dark ? 0.22 : 0.85,
        shadowRadius: 14,
      }}
    >
      <View className="flex-row gap-3">
        <SkeletonBlock borderRadius={14} height={76} width={124} />

        <View className="flex-1" style={{ gap: 8, minHeight: 76 }}>
          <View className="flex-row items-start justify-between gap-3">
            <SkeletonBlock borderRadius={999} height={24} width={92} />
            <View
              className="items-center justify-center rounded-full"
              style={{
                alignSelf: 'flex-start',
                backgroundColor: theme.surfaceAlt,
                height: 34,
                width: 34,
              }}
            >
              <SkeletonBlock borderRadius={999} height={16} width={16} />
            </View>
          </View>

          <SkeletonText lineHeight={14} lines={2} widths={['100%', '84%']} />

          <View className="mt-auto flex-row items-center gap-2">
            <View
              className="items-center justify-center rounded-full"
              style={{
                backgroundColor: theme.surfaceAlt,
                height: 26,
                width: 26,
              }}
            >
              <SkeletonBlock borderRadius={999} height={12} width={12} />
            </View>
            <SkeletonBlock borderRadius={999} height={10} width="48%" />
          </View>
        </View>
      </View>
    </Panel>
  );
}

export default function LibraryScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlashListRef<LibraryVideo | LibrarySkeletonItem> | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>('unwatched');
  const [appliedFilter, setAppliedFilter] = useState<LibraryFilter>('unwatched');
  const [search, setSearch] = useState('');
  const { handleScroll, hide, isVisible } = useScrollToTopButtonVisibility();
  const normalizedSearch = search.trim();
  const deferredSearch = useDeferredValue(normalizedSearch);
  const [isFilterPending, startFilterTransition] = useTransition();

  const { data: libraryRows } = useLiveQuery(getLibraryVideos(appliedFilter), [appliedFilter]);
  const retainedLibrary = useRetainedLiveQueryData<ResolvedLibraryData>(
    libraryRows === undefined
      ? undefined
      : {
          filter: appliedFilter,
          rows: libraryRows,
        },
  );
  const displayFilter = retainedLibrary.data?.filter ?? appliedFilter;
  const allVideos = mapLibraryVideos(retainedLibrary.data?.rows);
  const videos = filterLibraryVideos(allVideos, deferredSearch);
  const copy = COPY_BY_FILTER[displayFilter];
  const hasSearch = normalizedSearch.length > 0;
  const isInitialLoading = retainedLibrary.isInitialLoading;
  const isSearchPending = deferredSearch !== normalizedSearch;
  const showLoadingOverlay =
    !isInitialLoading &&
    (retainedLibrary.isRefreshing || displayFilter !== filter || isFilterPending);

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

    hide();
    setFilter(nextFilter);
    startFilterTransition(() => {
      setAppliedFilter(nextFilter);
    });
  };

  const handleScrollToTop = () => {
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
    hide();
  };

  const listData: (LibraryVideo | LibrarySkeletonItem)[] = isInitialLoading
    ? LIBRARY_SKELETON_ITEMS
    : videos;
  const resultLabel = videos.length === 1 ? 'resultado' : 'resultados';
  const totalLabel = allVideos.length === 1 ? 'vídeo' : 'vídeos';
  const helperCopy = showLoadingOverlay
    ? 'Atualizando a categoria sem tirar a lista atual de cena.'
    : isSearchPending
      ? 'Filtrando a lista atual...'
      : hasSearch
        ? `${videos.length} ${resultLabel} entre ${allVideos.length} ${totalLabel}.`
        : copy.helperText;
  const counterLabel = hasSearch ? 'Resultados' : copy.countLabel;

  return (
    <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: theme.background, flex: 1 }}>
      <View style={{ backgroundColor: theme.background, flex: 1, position: 'relative' }}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={{
              backgroundColor: theme.primarySoft,
              borderRadius: 180,
              height: 220,
              position: 'absolute',
              right: -74,
              top: -32,
              width: 220,
            }}
          />
          <View
            style={{
              backgroundColor: theme.accentSoft,
              borderRadius: 160,
              height: 172,
              left: -76,
              position: 'absolute',
              top: 168,
              width: 172,
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
          drawDistance={520}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          keyExtractor={(item) => ('kind' in item ? item.key : item.videoId)}
          ListEmptyComponent={
            isInitialLoading ? null : (
              <View style={{ paddingTop: 8 }}>
                <EmptyState
                  description={
                    hasSearch
                      ? `Nenhum vídeo desta seção combina com "${normalizedSearch}".`
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
                title="Gerencie sua curadoria com menos ruído."
                trailing={
                  isInitialLoading ? (
                    <CountBadgeSkeleton />
                  ) : (
                    <View
                      className="items-center justify-center px-4 py-3"
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderRadius: 16,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        className="text-center text-[11px] font-bold uppercase tracking-[1.5px]"
                        style={{ color: theme.textSoft }}
                      >
                        {counterLabel}
                      </Text>
                      <Text className="mt-1 text-[20px] font-extrabold" style={{ color: theme.text }}>
                        {videos.length}
                      </Text>
                    </View>
                  )
                }
              />

              <Panel
                style={{
                  borderRadius: 16,
                  elevation: 4,
                  gap: 16,
                  padding: 18,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: theme.dark ? 0.24 : 0.92,
                  shadowRadius: 16,
                }}
              >
                <SegmentedControl
                  onChange={handleFilterChange}
                  options={SEGMENTS}
                  tone="neutral"
                  value={filter}
                />

                <View
                  className="flex-row items-center gap-3 px-4 py-3"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.border,
                    borderRadius: 16,
                    borderWidth: 1,
                  }}
                >
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      backgroundColor: theme.surface,
                      height: 32,
                      width: 32,
                    }}
                  >
                    <Ionicons color={theme.textMuted} name="search-outline" size={16} />
                  </View>
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
                    <Pressable
                      accessibilityLabel="Limpar busca"
                      className="items-center justify-center rounded-full"
                      hitSlop={8}
                      onPress={() => setSearch('')}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
                        height: 30,
                        width: 30,
                      })}
                    >
                      <Ionicons color={theme.textMuted} name="close" size={16} />
                    </Pressable>
                  ) : null}
                </View>

                <Text
                  className="px-2 pt-1 text-[12px] leading-5"
                  style={{
                    color: theme.textSoft,
                    includeFontPadding: false,
                  }}
                >
                  {helperCopy}
                </Text>
              </Panel>
            </View>
          }
          onScroll={handleScroll}
          ref={listRef}
          renderItem={({ item }) =>
            'kind' in item ? (
              <LibraryCardSkeleton />
            ) : (
              <CompactVideoCard actions={getActionsForVideo(item)} status={displayFilter} video={item} />
            )
          }
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        />

        <ScrollToTopButton onPress={handleScrollToTop} visible={isVisible} />
        {showLoadingOverlay ? <ListLoadingOverlay label="Atualizando resultados" /> : null}
      </View>
    </SafeAreaView>
  );
}
