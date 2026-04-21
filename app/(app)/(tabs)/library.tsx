import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlashList } from '@shopify/flash-list';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { excludeVideo, markAsWatched, restoreExcludedVideo, unmarkAsWatched } from '@/features/timeline/actions';
import { CompactVideoCard, type CompactVideoAction } from '@/features/library/components/CompactVideoCard';
import {
  getLibraryVideos,
  mapLibraryVideos,
  type LibraryFilter,
  type LibraryVideo,
} from '@/features/library/queries';
import { useAppTheme } from '@/shared/theme/provider';
import { EmptyState } from '@/shared/ui/empty-state';
import { Panel, ScreenHeader } from '@/shared/ui/layout';
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

export default function LibraryScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<LibraryFilter>('unwatched');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const { data: libraryRows } = useLiveQuery(
    getLibraryVideos(filter, debouncedSearch),
    [filter, debouncedSearch],
  );
  const isLoading = libraryRows === undefined;
  const videos = mapLibraryVideos(libraryRows);
  const copy = COPY_BY_FILTER[filter];
  const hasSearch = debouncedSearch.length > 0;

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
    switch (filter) {
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

  return (
    <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: theme.background, flex: 1 }}>
      <View style={{ backgroundColor: theme.background, flex: 1 }}>
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
          data={videos}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          keyExtractor={(item) => item.videoId}
          ListEmptyComponent={
            isLoading ? (
              <View className="items-center justify-center" style={{ paddingTop: 40 }}>
                <ActivityIndicator color={theme.primary} size="large" />
              </View>
            ) : (
              <View style={{ paddingTop: 8 }}>
                <EmptyState
                  description={
                    hasSearch
                      ? `Nenhum vídeo encontrado para "${debouncedSearch}".`
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
                      style={{ color: theme.textMuted }}
                    >
                      {copy.countLabel}
                    </Text>
                    <Text className="mt-1 text-[20px] font-extrabold" style={{ color: theme.text }}>
                      {videos.length}
                    </Text>
                  </View>
                }
              />

              <Panel style={{ gap: 14 }}>
                <SegmentedControl options={SEGMENTS} onChange={setFilter} value={filter} />

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
                  Filtro em tempo real com debounce de 300 ms para título e canal.
                </Text>
              </Panel>
            </View>
          }
          renderItem={({ item }) => (
            <CompactVideoCard actions={getActionsForVideo(item)} status={filter} video={item} />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
