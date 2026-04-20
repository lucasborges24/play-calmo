import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useDemoStore } from '@/shared/state/demo-store';
import { useAppTheme } from '@/shared/theme/provider';
import { EmptyState } from '@/shared/ui/empty-state';
import {
  AppScrollScreen,
  MetricCard,
  Panel,
  ScreenHeader,
  SectionHeading,
  Tag,
} from '@/shared/ui/layout';
import { SegmentedControl } from '@/shared/ui/segmented-control';

const SEGMENTS = [
  { label: 'Fila', value: 'queue' },
  { label: 'Vistos', value: 'watched' },
  { label: 'Ocultos', value: 'hidden' },
] as const;

type SegmentValue = (typeof SEGMENTS)[number]['value'];

export default function LibraryScreen() {
  const { restoreVideo, removedVideos, videos } = useDemoStore();
  const { theme } = useAppTheme();
  const [segment, setSegment] = useState<SegmentValue>('queue');

  const queueVideos = videos.filter((video) => !video.removed && !video.watched);
  const watchedVideos = videos.filter((video) => video.watched);
  const activeVideos =
    segment === 'queue'
      ? queueVideos
      : segment === 'watched'
        ? watchedVideos
        : removedVideos;

  return (
    <AppScrollScreen>
      <ScreenHeader
        eyebrow="Biblioteca"
        subtitle="A tela saiu do placeholder e ganhou segmentos, cartões compactos e estados visuais coerentes com o restante do app."
        title="O que você já filtrou continua bonito aqui."
        trailing={
          <View
            className="items-center justify-center rounded-[20px] px-4 py-3"
            style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }}
          >
            <Text className="text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: theme.textMuted }}>
              Total
            </Text>
            <Text className="mt-1 text-[20px] font-extrabold" style={{ color: theme.text }}>
              {videos.length}
            </Text>
          </View>
        }
      />

      <Panel style={{ gap: 16 }}>
        <View className="flex-row gap-3">
          <MetricCard
            accent={theme.primary}
            hint="vídeos aguardando uma sessão"
            label="Na fila"
            value={`${queueVideos.length}`}
          />
          <MetricCard
            accent={theme.success}
            hint="itens que já cumpriram o papel deles"
            label="Vistos"
            value={`${watchedVideos.length}`}
          />
          <MetricCard
            accent={theme.accent}
            hint="conteúdos escondidos do radar"
            label="Ocultos"
            value={`${removedVideos.length}`}
          />
        </View>
      </Panel>

      <View className="gap-4">
        <SectionHeading
          detail={`${activeVideos.length} itens`}
          eyebrow="Organização"
          title="Troque de segmento sem perder contexto"
        />
        <SegmentedControl options={SEGMENTS} onChange={setSegment} value={segment} />
      </View>

      {activeVideos.length === 0 ? (
        <EmptyState
          description="Quando a fila mudar, este espaço já está pronto para receber estados vazios com a mesma linguagem do app."
          icon={segment === 'hidden' ? 'eye-off-outline' : 'library-outline'}
          title="Nada por aqui"
        />
      ) : (
        <View className="gap-4">
          {activeVideos.map((video) => {
            const tone =
              segment === 'watched' ? 'success' : segment === 'hidden' ? 'accent' : 'primary';

            return (
              <Panel key={video.id} style={{ padding: 14 }}>
                <View className="flex-row gap-4">
                  <View
                    className="overflow-hidden rounded-[20px]"
                    style={{
                      aspectRatio: 16 / 9,
                      backgroundColor: video.thumbnailColor,
                      minWidth: 116,
                      padding: 12,
                      width: 116,
                    }}
                  >
                    <View className="rounded-full bg-black/60 px-3 py-1.5 self-start">
                      <Text className="text-[11px] font-bold text-white">{video.duration}</Text>
                    </View>
                    <View className="mt-auto">
                      <Text className="text-[12px] font-medium text-white/70">{video.channel}</Text>
                      <Text className="mt-1 text-[18px] font-extrabold text-white">
                        {video.label}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-1 gap-3">
                    <View className="gap-2">
                      <Tag
                        label={
                          segment === 'queue'
                            ? 'Disponível'
                            : segment === 'watched'
                              ? 'Assistido'
                              : 'Ocultado'
                        }
                        tone={tone}
                      />
                      <Text className="text-[17px] font-bold leading-6" style={{ color: theme.text }}>
                        {video.title}
                      </Text>
                      <Text className="text-[13px] leading-6" style={{ color: theme.textSoft }}>
                        {video.summary}
                      </Text>
                    </View>

                    <Text className="text-[12px] font-medium" style={{ color: theme.textMuted }}>
                      {video.publishedLabel}
                    </Text>

                    {segment === 'hidden' ? (
                      <Pressable
                        className="flex-row items-center gap-2 self-start rounded-full px-4 py-2.5"
                        onPress={() => restoreVideo(video.id)}
                        style={{ backgroundColor: theme.surfaceAlt }}
                      >
                        <Ionicons color={theme.text} name="return-up-back-outline" size={16} />
                        <Text className="text-[12px] font-semibold" style={{ color: theme.text }}>
                          Restaurar à biblioteca
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </Panel>
            );
          })}
        </View>
      )}
    </AppScrollScreen>
  );
}
