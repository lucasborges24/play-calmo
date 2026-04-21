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
        backgroundColor: theme.primarySoft,
        icon: 'time-outline' as const,
        iconColor: theme.primary,
        label: 'Não assistido',
      };
    case 'watched':
      return {
        backgroundColor: theme.successSoft,
        icon: 'checkmark-circle-outline' as const,
        iconColor: theme.success,
        label: 'Assistido',
      };
    case 'excluded':
      return {
        backgroundColor: theme.accentSoft,
        icon: 'eye-off-outline' as const,
        iconColor: theme.text,
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
        <Panel style={{ padding: 12 }}>
          <View className="flex-row gap-3">
            <View style={{ position: 'relative' }}>
              {video.thumbnailUrl ? (
                <Image
                  contentFit="cover"
                  source={{ uri: video.thumbnailUrl }}
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    borderRadius: 16,
                    height: 64,
                    width: 112,
                  }}
                  transition={120}
                />
              ) : (
                <View
                  className="items-center justify-center rounded-[16px]"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    height: 64,
                    width: 112,
                  }}
                >
                  <Ionicons color={theme.textMuted} name="play-circle-outline" size={22} />
                </View>
              )}

              <View
                className="absolute rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  bottom: 6,
                  right: 6,
                }}
              >
                <Text className="text-[10px] font-bold text-white">
                  {secondsToLabel(video.durationSeconds)}
                </Text>
              </View>
            </View>

            <View className="flex-1 justify-between" style={{ minHeight: 64 }}>
              <Text
                className="text-[14px] font-bold leading-5"
                numberOfLines={2}
                style={{ color: theme.text }}
              >
                {video.title}
              </Text>

              <View className="flex-row items-center justify-between gap-2">
                <Text
                  className="flex-1 text-[12px]"
                  numberOfLines={1}
                  style={{ color: theme.textSoft }}
                >
                  {video.channelTitle}
                </Text>
                <View
                  className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: statusPresentation.backgroundColor }}
                >
                  <Ionicons
                    color={statusPresentation.iconColor}
                    name={statusPresentation.icon}
                    size={12}
                  />
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: statusPresentation.iconColor }}
                  >
                    {statusPresentation.label}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              className="items-center justify-center rounded-full"
              disabled={pendingActionKey !== null}
              hitSlop={8}
              onPress={openSheet}
              style={({ pressed }) => ({
                alignSelf: 'center',
                backgroundColor: pressed ? theme.surfaceMuted : theme.surfaceAlt,
                height: 32,
                width: 32,
              })}
            >
              {pendingActionKey ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <Ionicons color={theme.text} name="ellipsis-horizontal" size={18} />
              )}
            </Pressable>
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
