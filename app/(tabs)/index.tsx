import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

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

export default function HomeScreen() {
  const router = useRouter();
  const { channels, goalMinutes, markWatched, removeVideo, todayVideos, watchedMinutes } =
    useDemoStore();
  const { theme } = useAppTheme();
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');

  const activeChannels = channels.filter((channel) => channel.active).length;
  const remainingMinutes = Math.max(goalMinutes - watchedMinutes, 0);
  const progress = goalMinutes === 0 ? 0 : Math.min(100, (watchedMinutes / goalMinutes) * 100);
  const visibleVideos =
    selectedFilter === 'all'
      ? todayVideos
      : todayVideos.filter((video) => video.track === selectedFilter);

  return (
    <AppScrollScreen>
      <ScreenHeader
        eyebrow="Seu ritual"
        subtitle="O handoff virou um feed editorial: mais espaço, mais contraste suave e uma fila que parece curada em vez de só listada."
        title="Hoje, menos ruído e mais intenção."
        trailing={
          <View className="gap-3">
            <Pressable
              className="items-center justify-center rounded-[20px]"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                height: 48,
                width: 48,
              }}
            >
              <Ionicons color={theme.text} name="notifications-outline" size={22} />
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
          onCta={() => router.push('/(tabs)/biblioteca')}
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
  );
}
