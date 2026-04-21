import { Image } from 'expo-image';
import { Switch, Text, View } from 'react-native';

import type { Subscription } from '@/db/schema';
import { useAppTheme } from '@/shared/theme/provider';
import { Panel, Tag } from '@/shared/ui/layout';

type SubscriptionCardProps = {
  subscription: Subscription;
  onToggle: (channelId: string, isActive: boolean) => void;
};

export function SubscriptionCard({ subscription, onToggle }: SubscriptionCardProps) {
  const { theme } = useAppTheme();
  const isUnsubscribed = Boolean(subscription.unsubscribedAt);
  const titleInitial = subscription.title.charAt(0).toUpperCase() || '?';

  return (
    <Panel style={{ opacity: isUnsubscribed ? 0.4 : 1, padding: 16 }}>
      <View className="flex-row items-center gap-4">
        {subscription.thumbnailUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: subscription.thumbnailUrl }}
            style={{
              backgroundColor: theme.surfaceAlt,
              borderRadius: 24,
              height: 48,
              width: 48,
            }}
            transition={120}
          />
        ) : (
          <View
            className="items-center justify-center rounded-full"
            style={{
              backgroundColor: theme.primarySoft,
              height: 48,
              width: 48,
            }}
          >
            <Text className="text-[18px] font-extrabold" style={{ color: theme.primary }}>
              {titleInitial}
            </Text>
          </View>
        )}

        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-3">
            <Text
              className="flex-1 text-[16px] font-bold"
              ellipsizeMode="tail"
              numberOfLines={1}
              style={{ color: theme.text }}
            >
              {subscription.title}
            </Text>

            <Switch
              disabled={isUnsubscribed}
              ios_backgroundColor={theme.border}
              onValueChange={(value) => onToggle(subscription.channelId, value)}
              thumbColor="#FFFFFF"
              trackColor={{ false: theme.border, true: theme.primary }}
              value={subscription.isActive && !isUnsubscribed}
            />
          </View>

          {isUnsubscribed ? (
            <Tag label="Desinscrito no YT" tone="neutral" />
          ) : (
            <Text className="text-[13px]" style={{ color: theme.textSoft }}>
              {subscription.isActive ? 'Entrando na curadoria diária.' : 'Fora da curadoria diária.'}
            </Text>
          )}
        </View>
      </View>
    </Panel>
  );
}
