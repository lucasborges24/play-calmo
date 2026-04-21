import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import WebView from 'react-native-webview';

import type { VideoWithPosition } from '@/db/queries/daily-plan';
import { secondsToLabel } from '@/shared/lib/duration';
import { useAppTheme } from '@/shared/theme/provider';
import { Panel, Tag } from '@/shared/ui/layout';

type VideoCardProps = {
  onExclude: (videoId: string) => Promise<void>;
  onMarkWatched: (videoId: string) => Promise<void>;
  onRemoveFromToday: (videoId: string) => Promise<void>;
  video: VideoWithPosition;
};

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
        minWidth: 112,
      }}
    >
      <Ionicons color={textColor} name={icon} size={20} />
      <Text className="text-center text-[12px] font-bold" style={{ color: textColor }}>
        {label}
      </Text>
    </Pressable>
  );
}

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

export function VideoCard({
  onExclude,
  onMarkWatched,
  onRemoveFromToday,
  video,
}: VideoCardProps) {
  const swipeableRef = useRef<Swipeable | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'exclude' | 'remove' | 'watched' | null>(null);
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const handleAction = async (
    action: 'exclude' | 'remove' | 'watched',
    callback: () => Promise<void>,
  ) => {
    if (pendingAction) {
      return;
    }

    setPendingAction(action);

    try {
      await callback();
      setSheetVisible(false);
      swipeableRef.current?.close();
    } finally {
      setPendingAction(null);
    }
  };

  const openVideo = () => setPlayerVisible(true);

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={() => (
          <View className="pr-3">
            <SwipeAction
              backgroundColor={theme.success}
              icon="checkmark"
              label="Marcar visto"
              onPress={() => {
                void handleAction('watched', () => onMarkWatched(video.videoId));
              }}
              textColor="#FFFFFF"
            />
          </View>
        )}
        renderRightActions={() => (
          <View className="pl-3">
            <SwipeAction
              backgroundColor={theme.accent}
              icon="close"
              label="Remover do dia"
              onPress={() => {
                void handleAction('remove', () => onRemoveFromToday(video.videoId));
              }}
              textColor={theme.text}
            />
          </View>
        )}
      >
        <Pressable
          disabled={pendingAction !== null}
          onLongPress={() => setSheetVisible(true)}
          onPress={openVideo}
        >
          <Panel style={{ padding: 12 }}>
            <View className="flex-row gap-4">
              {video.thumbnailUrl ? (
                <Image
                  contentFit="cover"
                  source={{ uri: video.thumbnailUrl }}
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    borderRadius: 20,
                    height: 68,
                    width: 120,
                  }}
                  transition={120}
                />
              ) : (
                <View
                  className="items-center justify-center rounded-[20px]"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    height: 68,
                    width: 120,
                  }}
                >
                  <Ionicons color={theme.textMuted} name="play-circle-outline" size={24} />
                </View>
              )}

              <View className="flex-1 gap-2">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-2">
                    <Text
                      className="text-[16px] font-bold leading-6"
                      numberOfLines={2}
                      style={{ color: theme.text }}
                    >
                      {video.title}
                    </Text>
                    <Text className="text-[13px]" numberOfLines={1} style={{ color: theme.textSoft }}>
                      {video.channelTitle}
                    </Text>
                  </View>

                  {pendingAction ? (
                    <ActivityIndicator color={theme.primary} size="small" />
                  ) : (
                    <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: theme.surfaceAlt }}>
                      <Text className="text-[11px] font-bold" style={{ color: theme.text }}>
                        {secondsToLabel(video.durationSeconds)}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center gap-2">
                  {video.source === 'trending' ? <Tag label="trending" tone="accent" /> : null}
                  <Text className="text-[12px] font-medium" style={{ color: theme.textMuted }}>
                    Toque para assistir
                  </Text>
                </View>
              </View>
            </View>
          </Panel>
        </Pressable>
      </Swipeable>

      <Modal
        animationType="slide"
        onRequestClose={() => setPlayerVisible(false)}
        statusBarTranslucent
        visible={playerVisible}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View
            style={{
              paddingTop: insets.top + 8,
              paddingHorizontal: 16,
              paddingBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Pressable
              onPress={() => setPlayerVisible(false)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons color="#fff" name="chevron-down" size={28} />
            </Pressable>
            <Text className="flex-1 text-[14px] font-bold" numberOfLines={1} style={{ color: '#fff' }}>
              {video.title}
            </Text>
          </View>

          {playerVisible ? (
            <WebView
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              source={{
                uri: `https://www.youtube.com/embed/${video.videoId}?autoplay=1&playsinline=1`,
              }}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      </Modal>

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
