import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import type { VideoWithPosition } from '@/db/queries/daily-plan';
import { TodaySwipeRow } from '@/features/timeline/components/TodaySwipeRow';
import {
  getAvailableTodaySwipeActions,
  getTodaySwipeActionWidth,
  type TodaySwipeAction,
} from '@/features/timeline/today-swipe';
import { usePlaybackStore } from '@/features/playback/store';
import { secondsToLabel } from '@/shared/lib/duration';
import { useAppTheme } from '@/shared/theme/provider';
import { Panel, Tag } from '@/shared/ui/layout';

const ACTION_WIDTH = getTodaySwipeActionWidth();

type VideoCardProps = {
  onExclude: (videoId: string) => Promise<void>;
  onMarkWatched: (videoId: string) => Promise<void>;
  onRemoveFromToday: (videoId: string) => Promise<void>;
  video: VideoWithPosition;
};

type SheetButtonProps = {
  destructive?: boolean;
  label: string;
  onPress: () => void;
};

function SheetButton({ destructive = false, label, onPress }: SheetButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      className="items-center justify-center rounded-[20px] px-4 py-4"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.surfaceMuted : theme.surfaceAlt,
      })}
    >
      <Text
        className="text-[15px] font-bold"
        style={{ color: destructive ? theme.primary : theme.text }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SwipeActionProps = {
  backgroundColor: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  textColor: string;
};

function SwipeAction({
  backgroundColor,
  icon,
  label,
  onPress,
  textColor,
}: SwipeActionProps) {
  return (
    <Pressable
      className="items-center justify-center gap-2 rounded-[28px] px-5"
      onPress={onPress}
      style={{
        alignSelf: 'stretch',
        backgroundColor,
        height: '100%',
        minWidth: ACTION_WIDTH,
      }}
    >
      <Ionicons color={textColor} name={icon} size={20} />
      <Text className="text-center text-[12px] font-bold" style={{ color: textColor }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function VideoCard({
  onExclude,
  onMarkWatched,
  onRemoveFromToday,
  video,
}: VideoCardProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<TodaySwipeAction | 'exclude' | null>(null);
  const openPlayback = usePlaybackStore((s) => s.open);
  const { theme } = useAppTheme();

  const handleAction = async (
    action: TodaySwipeAction | 'exclude',
    callback: () => Promise<void>,
  ) => {
    if (pendingAction) {
      return;
    }

    setPendingAction(action);

    try {
      await callback();
      setSheetVisible(false);
    } finally {
      setPendingAction(null);
    }
  };

  const openVideo = () => openPlayback(video);

  const isWatched = Boolean(video.watchedAt);
  const availableSwipeActions = getAvailableTodaySwipeActions(isWatched);

  return (
    <>
      <TodaySwipeRow
        availableActions={availableSwipeActions}
        disabled={pendingAction !== null}
        onAction={(action) =>
          handleAction(
            action,
            action === 'mark-watched'
              ? () => onMarkWatched(video.videoId)
              : () => onRemoveFromToday(video.videoId),
          )
        }
        renderAction={(action, onPress) =>
          action === 'mark-watched' ? (
            <View className="pr-3" style={{ height: '100%' }}>
              <SwipeAction
                backgroundColor={theme.success}
                icon="checkmark"
                label="Marcar visto"
                onPress={onPress}
                textColor="#FFFFFF"
              />
            </View>
          ) : (
            <View className="pl-3" style={{ height: '100%' }}>
              <SwipeAction
                backgroundColor={theme.accent}
                icon="close"
                label="Remover do dia"
                onPress={onPress}
                textColor={theme.text}
              />
            </View>
          )
        }
      >
        <Pressable
          disabled={pendingAction !== null}
          onLongPress={() => setSheetVisible(true)}
          onPress={openVideo}
          style={isWatched ? { opacity: 0.72 } : undefined}
        >
          <Panel style={{ padding: 0 }}>
            <View
              style={{
                aspectRatio: 16 / 9,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                overflow: 'hidden',
              }}
            >
              {video.thumbnailUrl ? (
                <Image
                  contentFit="cover"
                  source={{ uri: video.thumbnailUrl }}
                  style={{ width: '100%', height: '100%' }}
                  transition={120}
                />
              ) : (
                <View
                  className="items-center justify-center"
                  style={{ backgroundColor: theme.surfaceAlt, flex: 1 }}
                >
                  <Ionicons color={theme.textMuted} name="play-circle-outline" size={40} />
                </View>
              )}

              {!pendingAction ? (
                <View
                  className="absolute inset-0 items-center justify-center"
                  pointerEvents="none"
                >
                  <View
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.48)',
                      borderRadius: 999,
                      padding: 14,
                    }}
                  >
                    <Ionicons color="#fff" name="play" size={26} />
                  </View>
                </View>
              ) : (
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.32)' }}
                  pointerEvents="none"
                >
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              )}

              <View
                style={{
                  backgroundColor: 'rgba(0,0,0,0.72)',
                  borderRadius: 6,
                  bottom: 10,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  position: 'absolute',
                  right: 10,
                }}
              >
                <Text className="text-[12px] font-bold" style={{ color: '#fff' }}>
                  {secondsToLabel(video.durationSeconds)}
                </Text>
              </View>
            </View>

            <View style={{ gap: 6, padding: 14 }}>
              <View className="flex-row items-center gap-2">
                <Tag
                  label={video.source === 'trending' ? 'Trending' : 'Assinatura'}
                  tone={video.source === 'trending' ? 'accent' : 'neutral'}
                />
                {isWatched ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: theme.successSoft,
                      borderRadius: 99,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                    }}
                  >
                    <Ionicons color={theme.success} name="checkmark-circle" size={13} />
                    <Text style={{ color: theme.success, fontSize: 12, fontWeight: '700' }}>
                      Visto
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                className="text-[20px] font-extrabold leading-[26px]"
                numberOfLines={3}
                style={{ color: theme.text }}
              >
                {video.title}
              </Text>

              <Text className="text-[13px]" numberOfLines={1} style={{ color: theme.textSoft }}>
                {video.channelTitle}
              </Text>
            </View>
          </Panel>
        </Pressable>
      </TodaySwipeRow>

      <Modal
        animationType="fade"
        onRequestClose={() => setSheetVisible(false)}
        transparent
        visible={sheetVisible}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.24)', padding: 16 }}
        >
          <Pressable className="absolute inset-0" onPress={() => setSheetVisible(false)} />

          <View
            className="gap-3 rounded-[28px] p-4"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <Text className="text-[18px] font-extrabold" style={{ color: theme.text }}>
              Acoes do video
            </Text>
            <Text className="text-[13px] leading-6" style={{ color: theme.textSoft }}>
              Excluir remove este video das proximas selecoes locais.
            </Text>

            <SheetButton
              destructive
              label={pendingAction === 'exclude' ? 'Excluindo...' : 'Excluir (nao aparecer mais)'}
              onPress={() => {
                void handleAction('exclude', () => onExclude(video.videoId));
              }}
            />
            <SheetButton label="Cancelar" onPress={() => setSheetVisible(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}
