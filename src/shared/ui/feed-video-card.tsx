import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { AppVideo } from '@/shared/state/demo-store';
import { Panel, Tag } from '@/shared/ui/layout';
import { useAppTheme } from '@/shared/theme/provider';

type FeedVideoCardProps = {
  onMarkWatched: (id: string) => void;
  onRemove: (id: string) => void;
  video: AppVideo;
};

type ActionPillProps = {
  disabled?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tone?: 'neutral' | 'primary' | 'success';
};

function ActionPill({ disabled, icon, label, onPress, tone = 'neutral' }: ActionPillProps) {
  const { theme } = useAppTheme();

  const toneColors = {
    neutral: {
      backgroundColor: theme.surfaceAlt,
      color: theme.text,
    },
    primary: {
      backgroundColor: theme.primarySoft,
      color: theme.primary,
    },
    success: {
      backgroundColor: theme.successSoft,
      color: theme.success,
    },
  } as const;

  const colors = toneColors[tone];

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed && !disabled ? theme.surfaceMuted : colors.backgroundColor,
        borderRadius: 999,
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        minHeight: 44,
        opacity: disabled ? 0.45 : 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
      })}
    >
      <Ionicons color={colors.color} name={icon} size={16} />
      <Text className="text-[12px] font-semibold" style={{ color: colors.color }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FeedVideoCard({ onMarkWatched, onRemove, video }: FeedVideoCardProps) {
  const { theme } = useAppTheme();

  return (
    <Panel style={{ padding: 12 }}>
      <View
        className="overflow-hidden rounded-[22px]"
        style={{
          aspectRatio: 16 / 9,
          backgroundColor: video.thumbnailColor,
          padding: 14,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 120,
            height: 120,
            position: 'absolute',
            right: -26,
            top: -30,
            width: 120,
          }}
        />
        <View className="flex-row items-start justify-between">
          <Tag label={video.label} tone="primary" />
          <View className="rounded-full bg-black/60 px-3 py-1.5">
            <Text className="text-[11px] font-bold text-white">{video.duration}</Text>
          </View>
        </View>

        <View className="mt-auto gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-medium text-white/70">{video.channel}</Text>
            <View className="items-center justify-center rounded-full bg-white/15 p-2.5">
              <Ionicons color="#FFFFFF" name="play" size={18} />
            </View>
          </View>
          <Text className="text-[22px] font-extrabold leading-[28px] text-white">
            {video.title}
          </Text>
        </View>
      </View>

      <View className="gap-4 px-2 pb-2 pt-4">
        <View className="flex-row items-center justify-between gap-4">
          <Text className="flex-1 text-[13px] leading-6" style={{ color: theme.textSoft }}>
            {video.summary}
          </Text>
          <Text className="text-[12px] font-semibold" style={{ color: theme.textMuted }}>
            {video.publishedLabel}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <ActionPill
            icon="checkmark-circle-outline"
            label="Marcar visto"
            onPress={() => onMarkWatched(video.id)}
            tone="success"
          />
          <ActionPill
            icon="remove-circle-outline"
            label="Tirar do dia"
            onPress={() => onRemove(video.id)}
            tone="neutral"
          />
        </View>
      </View>
    </Panel>
  );
}
