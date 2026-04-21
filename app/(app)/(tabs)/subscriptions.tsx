import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { db, schema } from '@/db/client';
import { getAllSubscriptions, toggleSubscriptionActive } from '@/db/queries/subscriptions';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import { useSyncSubscriptions } from '@/features/subscriptions/hooks';
import { useAppTheme } from '@/shared/theme/provider';
import { EmptyState } from '@/shared/ui/empty-state';
import { Panel } from '@/shared/ui/layout';

function formatLastSync(lastSubsSyncAt: number | null) {
  if (!lastSubsSyncAt) {
    return 'nunca';
  }

  const diffMs = Date.now() - lastSubsSyncAt;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) {
    return 'agora';
  }

  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `há ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} d`;
}

export default function SubscriptionsScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const syncMutation = useSyncSubscriptions();
  const { data: subscriptionsData } = useLiveQuery(getAllSubscriptions());
  const { data: settingsData } = useLiveQuery(
    db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1),
  );

  const subscriptions = subscriptionsData ?? [];
  const settings = settingsData?.[0] ?? null;
  const activeCount = subscriptions.filter(
    (subscription) => subscription.isActive && !subscription.unsubscribedAt,
  ).length;
  const totalCount = subscriptions.length;
  const lastSyncLabel = formatLastSync(settings?.lastSubsSyncAt ?? null);

  const handleRefresh = () => {
    if (syncMutation.isPending) {
      return;
    }

    void syncMutation.mutateAsync();
  };

  const handleToggle = (channelId: string, isActive: boolean) => {
    void toggleSubscriptionActive(channelId, isActive);
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
          data={subscriptions}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          keyExtractor={(item) => item.channelId}
          ListEmptyComponent={
            <View style={{ paddingTop: 24 }}>
              <EmptyState
                ctaLabel="Sincronizar agora"
                description="Conecte sua conta ao YouTube e puxe suas inscrições para começar a curadoria."
                icon="sync-outline"
                onCta={handleRefresh}
                title="Nenhuma inscrição sincronizada"
              />
            </View>
          }
          ListHeaderComponent={
            <View style={{ paddingBottom: 18 }}>
              <Panel style={{ gap: 12 }}>
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1 gap-2">
                    <Text
                      className="text-[28px] font-extrabold leading-[34px]"
                      style={{ color: theme.text }}
                    >
                      Inscrições
                    </Text>
                    <Text className="text-[15px] leading-6" style={{ color: theme.textSoft }}>
                      {`${activeCount} ativas de ${totalCount} total`}
                    </Text>
                    <Text className="text-[13px] font-medium" style={{ color: theme.textMuted }}>
                      {`Última sync: ${lastSyncLabel}`}
                    </Text>
                  </View>

                  {syncMutation.isPending ? (
                    <ActivityIndicator color={theme.primary} size="small" />
                  ) : null}
                </View>
              </Panel>
            </View>
          }
          onRefresh={handleRefresh}
          refreshing={syncMutation.isPending}
          renderItem={({ item }) => (
            <SubscriptionCard onToggle={handleToggle} subscription={item} />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
