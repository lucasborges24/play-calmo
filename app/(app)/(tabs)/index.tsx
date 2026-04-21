import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JobProgressModal } from '@/features/jobs/components/JobProgressModal';
import { useRunJob } from '@/features/jobs/hooks';
import { Wordmark } from '@/shared/ui/wordmark';

import { formatCalendarLabel, formatMinutes } from '@/shared/lib/formatters';
import { useDemoStore } from '@/shared/state/demo-store';
import { useAppTheme } from '@/shared/theme/provider';
import { EmptyState } from '@/shared/ui/empty-state';
import { FeedVideoCard } from '@/shared/ui/feed-video-card';
import {
  AppScrollScreen,
  MetricCard,
  Panel,
  ScreenHeader,
  SectionHeading,
  Tag,
} from '@/shared/ui/layout';

const FILTERS = [
  { label: 'Fila completa', value: 'all' },
  { label: 'Ritual', value: 'Ritual' },
  { label: 'Curtos', value: 'Curtos' },
  { label: 'Respirar', value: 'Respirar' },
] as const;

type FilterValue = (typeof FILTERS)[number]['value'];

function formatJobToast(videosAdded: number, errorsCount: number) {
  const base = `${videosAdded} vídeo${videosAdded === 1 ? '' : 's'} adicionado${videosAdded === 1 ? '' : 's'}.`;

  if (errorsCount === 0) {
    return base;
  }

  return `${base} ${errorsCount} falha${errorsCount === 1 ? '' : 's'} durante a coleta.`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { channels, goalMinutes, markWatched, removeVideo, todayVideos, watchedMinutes } =
    useDemoStore();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const runJobMutation = useRunJob();
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeChannels = channels.filter((channel) => channel.active).length;
  const remainingMinutes = Math.max(goalMinutes - watchedMinutes, 0);
  const progress = goalMinutes === 0 ? 0 : Math.min(100, (watchedMinutes / goalMinutes) * 100);
  const visibleVideos =
    selectedFilter === 'all'
      ? todayVideos
      : todayVideos.filter((video) => video.track === selectedFilter);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const handleRunJob = async () => {
    if (runJobMutation.isPending) {
      return;
    }

    try {
      const result = await runJobMutation.mutateAsync('manual');
      setToastMessage(formatJobToast(result.videosAdded, result.errors.length));
    } catch {
      setToastMessage('Falha ao executar o job de busca.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppScrollScreen>
        <ScreenHeader
          eyebrow="Seu ritual"
          subtitle="O handoff virou um feed editorial: mais espaço, mais contraste suave e uma fila que parece curada em vez de só listada."
          title="Hoje, menos ruído e mais intenção."
          trailing={
            <View className="gap-3">
              <Pressable
                className="items-center justify-center rounded-[20px]"
                disabled={runJobMutation.isPending}
                onPress={() => {
                  void handleRunJob();
                }}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: 1,
                  height: 48,
                  opacity: runJobMutation.isPending ? 0.7 : 1,
                  width: 48,
                }}
              >
                {runJobMutation.isPending ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <RefreshCw color={theme.text} size={20} />
                )}
              </Pressable>
              <View
                className="items-center justify-center rounded-[20px]"
                style={{
                  backgroundColor: theme.primary,
                  height: 48,
                  width: 48,
                }}
              >
                <Text className="text-[16px] font-extrabold text-white">L</Text>
              </View>
            </View>
          }
        />

        <Panel style={{ gap: 16, padding: 20 }}>
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-2">
              <Wordmark color={theme.text} accent={theme.primary} fontSize={14} />
              <Text className="text-[14px]" style={{ color: theme.textSoft }}>
                {formatCalendarLabel()}
              </Text>
            </View>
            <View
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: theme.primarySoft }}
            >
              <Text className="text-[12px] font-bold" style={{ color: theme.primary }}>
                {Math.round(progress)}% da meta
              </Text>
            </View>
          </View>
        <View className="gap-4">
          <Text className="text-[24px] font-extrabold leading-[32px]" style={{ color: theme.text }}>
            {formatMinutes(watchedMinutes)} já ficaram para trás. Restam {formatMinutes(remainingMinutes)} para encerrar o dia com margem.
          </Text>

          <View
            className="overflow-hidden rounded-full"
            style={{ backgroundColor: theme.surfaceAlt, height: 8 }}
          >
            <View
              className="h-full rounded-full"
              style={{
                backgroundColor: progress >= 100 ? theme.success : theme.primary,
                width: `${progress}%`,
              }}
            />
          </View>

          <View className="flex-row gap-3">
            <MetricCard
              accent={theme.primary}
              hint="até bater a meta definida no app"
              label="Faltam"
              value={formatMinutes(remainingMinutes)}
            />
            <MetricCard
              accent={theme.accent}
              hint="canais ativos alimentando a curadoria"
              label="Ativos"
              value={`${activeChannels}`}
            />
          </View>
        </View>
        </Panel>

        <View className="gap-4">
          <SectionHeading
            detail={`${visibleVideos.length} vídeos`}
            eyebrow="Curadoria"
            title="Escolha o ritmo da fila"
          />
          <View className="flex-row flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <Tag
                key={filter.value}
                active={selectedFilter === filter.value}
                label={filter.label}
                onPress={() => setSelectedFilter(filter.value)}
                tone={selectedFilter === filter.value ? 'primary' : 'neutral'}
              />
            ))}
          </View>
        </View>

        <Panel style={{ alignItems: 'center', flexDirection: 'row', gap: 12, padding: 14 }}>
          <View
            className="items-center justify-center rounded-[18px]"
            style={{
              backgroundColor: theme.accentSoft,
              height: 44,
              width: 44,
            }}
          >
            <Ionicons color={theme.text} name="hand-left-outline" size={20} />
          </View>
          <Text className="flex-1 text-[13px] leading-6" style={{ color: theme.textSoft }}>
            O foco aqui foi layout. As ações dos cards existem só para dar contexto visual e ritmo à tela.
          </Text>
        </Panel>

        {visibleVideos.length === 0 ? (
          <EmptyState
            ctaLabel="Abrir biblioteca"
            description="Sua curadoria do dia já está limpa. Acesse a biblioteca para ver o que ficou guardado."
            icon="sparkles-outline"
            onCta={() => router.push('/(app)/(tabs)/library')}
            title="Fila encerrada"
          />
        ) : (
          <View className="gap-4">
            {visibleVideos.map((video) => (
              <FeedVideoCard
                key={video.id}
                onMarkWatched={markWatched}
                onRemove={removeVideo}
                video={video}
              />
            ))}
          </View>
        )}
      </AppScrollScreen>

      {toastMessage ? (
        <View
          pointerEvents="none"
          style={{
            bottom: insets.bottom + 92,
            left: 20,
            position: 'absolute',
            right: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: 999,
              borderWidth: 1,
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: theme.dark ? 0.28 : 1,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <Text className="text-center text-[13px] font-semibold" style={{ color: theme.text }}>
              {toastMessage}
            </Text>
          </View>
        </View>
      ) : null}

      <JobProgressModal progress={runJobMutation.progress} visible={runJobMutation.isPending} />
    </View>
  );
}
