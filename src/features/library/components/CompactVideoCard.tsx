import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';

import type { LibraryFilter, LibraryVideo } from '@/features/library/queries';
import { secondsToLabel } from '@/shared/lib/duration';
import { useAppTheme } from '@/shared/theme/provider';
import { Panel } from '@/shared/ui/layout';

export type CompactVideoAction = {
  destructive?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  key: string;
  label: string;
  loadingLabel?: string;
  onPress: () => Promise<void> | void;
};

type CompactVideoCardProps = {
  actions: CompactVideoAction[];
  status: LibraryFilter;
  video: LibraryVideo;
};

function getStatusPresentation(
  filter: LibraryFilter,
  theme: ReturnType<typeof useAppTheme>['theme'],
) {
  switch (filter) {
    case 'unwatched':
      return {
        backgroundColor: theme.surfaceAlt,
        borderColor: theme.border,
        icon: 'time-outline' as const,
        iconColor: theme.textSoft,
        label: 'Não assistido',
      };
    case 'watched':
      return {
        backgroundColor: theme.successSoft,
        borderColor: 'transparent',
        icon: 'checkmark-circle-outline' as const,
        iconColor: theme.success,
        label: 'Assistido',
      };
    case 'excluded':
      return {
        backgroundColor: theme.accentSoft,
        borderColor: 'transparent',
        icon: 'eye-off-outline' as const,
        iconColor: theme.textSoft,
        label: 'Excluído',
      };
  }
}

function SheetButton({
  destructive = false,
  icon,
  label,
  loading,
  onPress,
}: {
  destructive?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      className="flex-row items-center justify-center gap-2 rounded-[20px] px-4 py-4"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.surfaceMuted : theme.surfaceAlt,
        opacity: loading ? 0.7 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={destructive ? theme.primary : theme.text} size="small" />
      ) : (
        <Ionicons color={destructive ? theme.primary : theme.text} name={icon} size={18} />
      )}
      <Text
        className="text-[15px] font-bold"
        style={{ color: destructive ? theme.primary : theme.text }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CompactVideoCard({ actions, status, video }: CompactVideoCardProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const { theme } = useAppTheme();
  const statusPresentation = getStatusPresentation(status, theme);
  const channelInitial = video.channelTitle.charAt(0).toUpperCase() || '?';

  const openSheet = () => {
    if (!pendingActionKey) {
      setSheetVisible(true);
    }
  };

  const handleActionPress = async (action: CompactVideoAction) => {
    if (pendingActionKey) {
      return;
    }

    setPendingActionKey(action.key);

    try {
      await action.onPress();
      setSheetVisible(false);
    } catch {
      // The parent action handles user-facing errors.
    } finally {
      setPendingActionKey(null);
    }
  };

  return (
    <>
      <Pressable disabled={pendingActionKey !== null} onLongPress={openSheet} onPress={openSheet}>
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
            <View style={{ position: 'relative' }}>
              {video.thumbnailUrl ? (
                <Image
                  contentFit="cover"
                  source={{ uri: video.thumbnailUrl }}
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    borderRadius: 14,
                    height: 76,
                    width: 124,
                  }}
                  transition={120}
                />
              ) : (
                <View
                  className="items-center justify-center rounded-[14px]"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    height: 76,
                    width: 124,
                  }}
                >
                  <Ionicons color={theme.textMuted} name="play-circle-outline" size={22} />
                </View>
              )}

              <View
                className="absolute rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  bottom: 8,
                  right: 8,
                }}
              >
                <Text className="text-[10px] font-bold text-white">
                  {secondsToLabel(video.durationSeconds)}
                </Text>
              </View>
            </View>

            <View className="flex-1" style={{ gap: 8, minHeight: 76 }}>
              <View className="flex-row items-start justify-between gap-3">
                <View
                  className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: statusPresentation.backgroundColor,
                    borderColor: statusPresentation.borderColor,
                    borderWidth: statusPresentation.borderColor === 'transparent' ? 0 : 1,
                  }}
                >
                  <Ionicons
                    color={statusPresentation.iconColor}
                    name={statusPresentation.icon}
                    size={12}
                  />
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: statusPresentation.iconColor }}
                  >
                    {statusPresentation.label}
                  </Text>
                </View>

                <Pressable
                  className="items-center justify-center rounded-full"
                  disabled={pendingActionKey !== null}
                  hitSlop={8}
                  onPress={openSheet}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? theme.surfaceMuted : theme.surfaceAlt,
                    height: 34,
                    width: 34,
                  })}
                >
                  {pendingActionKey ? (
                    <ActivityIndicator color={theme.primary} size="small" />
                  ) : (
                    <Ionicons color={theme.text} name="ellipsis-horizontal" size={18} />
                  )}
                </Pressable>
              </View>

              <Text
                className="text-[15px] font-bold leading-6"
                numberOfLines={2}
                style={{ color: theme.text }}
              >
                {video.title}
              </Text>

              <View className="mt-auto flex-row items-center gap-2">
                {video.channelThumbnailUrl ? (
                  <Image
                    contentFit="cover"
                    source={{ uri: video.channelThumbnailUrl }}
                    style={{
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                      borderRadius: 13,
                      borderWidth: 1,
                      height: 26,
                      width: 26,
                    }}
                    transition={120}
                  />
                ) : (
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                      borderWidth: 1,
                      height: 26,
                      width: 26,
                    }}
                  >
                    <Text className="text-[11px] font-bold" style={{ color: theme.textMuted }}>
                      {channelInitial}
                    </Text>
                  </View>
                )}
                <Text
                  className="flex-1 text-[12px] leading-5"
                  numberOfLines={1}
                  style={{ color: theme.textSoft }}
                >
                  {video.channelTitle}
                </Text>
              </View>
            </View>
          </View>
        </Panel>
      </Pressable>

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
              Ações do vídeo
            </Text>
            <Text className="text-[13px] leading-6" style={{ color: theme.textSoft }}>
              {video.title}
            </Text>

            {actions.map((action) => (
              <SheetButton
                key={action.key}
                destructive={action.destructive}
                icon={action.icon}
                label={
                  pendingActionKey === action.key
                    ? (action.loadingLabel ?? action.label)
                    : action.label
                }
                loading={pendingActionKey === action.key}
                onPress={() => {
                  void handleActionPress(action);
                }}
              />
            ))}

            <SheetButton icon="close-outline" label="Cancelar" onPress={() => setSheetVisible(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}
