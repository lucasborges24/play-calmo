import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import type { FlashListRef } from '@shopify/flash-list';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useDeferredValue, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/shared/components/Button';
import { db, schema } from '@/db/client';
import {
  getAllSubscriptionsWithLatestPublishedAt,
  toggleSubscriptionActive,
  type SubscriptionWithLatestPublishedAt,
} from '@/db/queries/subscriptions';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import {
  buildSubscriptionListData,
  type SubscriptionListItem,
  type SubscriptionSort,
} from '@/features/subscriptions/list-data';
import { useSyncSubscriptions } from '@/features/subscriptions/hooks';
import { useRetainedLiveQueryData } from '@/shared/hooks/useRetainedLiveQueryData';
import { useAppTheme } from '@/shared/theme/provider';
import { EmptyState } from '@/shared/ui/empty-state';
import { Panel } from '@/shared/ui/layout';
import { ScrollToTopButton, useScrollToTopButtonVisibility } from '@/shared/ui/scroll-to-top-button';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { ListLoadingOverlay, SkeletonBlock, SkeletonText } from '@/shared/ui/skeleton';

type SubscriptionSkeletonItem = {
  key: string;
  kind: 'skeleton';
};

type SubscriptionScreenListItem = SubscriptionListItem | SubscriptionSkeletonItem;

const SUBSCRIPTION_SKELETON_ITEMS: SubscriptionSkeletonItem[] = Array.from(
  { length: 6 },
  (_, index) => ({
    key: `subscription-skeleton-${index}`,
    kind: 'skeleton',
  }),
);

const SORT_OPTIONS = [
  { label: 'Nome', value: 'name' },
  { label: 'Última pub.', value: 'latest-published' },
] as const satisfies readonly { label: string; value: SubscriptionSort }[];

function formatRelativeTime(timestamp: number | null, fallback: string) {
  if (!timestamp) {
    return fallback;
  }

  const diffMs = Date.now() - timestamp;
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

function formatSubscriptionDetail(subscription: SubscriptionWithLatestPublishedAt) {
  const statusLabel = subscription.isActive ? 'Na curadoria' : 'Fora da curadoria';
  const publicationLabel = subscription.latestPublishedAt
    ? `Última publicação ${formatRelativeTime(subscription.latestPublishedAt, 'agora')}`
    : 'Sem vídeos coletados';

  return `${statusLabel} · ${publicationLabel}`;
}

function SubscriptionsSummarySkeleton() {
  return (
    <Panel style={{ gap: 16 }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-3">
          <SkeletonBlock borderRadius={999} height={14} width={122} />
          <SkeletonBlock borderRadius={999} height={34} width={168} />
          <SkeletonBlock borderRadius={999} height={14} width={148} />
          <SkeletonBlock borderRadius={999} height={12} width={118} />
        </View>

        <SkeletonBlock borderRadius={16} height={38} width={112} />
      </View>
    </Panel>
  );
}

function SubscriptionsControlsSkeleton() {
  return (
    <Panel style={{ gap: 14, padding: 14 }}>
      <SkeletonBlock borderRadius={20} height={52} width="100%" />
      <SkeletonBlock borderRadius={24} height={54} width="100%" />
      <SkeletonBlock borderRadius={999} height={12} width={164} />
    </Panel>
  );
}

function SubscriptionSectionHeader({ count, title }: { count: number; title: string }) {
  const { theme } = useAppTheme();
  const countLabel = `${count} ${count === 1 ? 'canal' : 'canais'}`;

  return (
    <View
      style={{
        backgroundColor: theme.background,
        paddingBottom: 2,
        paddingTop: 8,
      }}
    >
      <View
        className="flex-row items-center justify-between rounded-[20px] px-4 py-3"
        style={{
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
          borderWidth: 1,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: theme.dark ? 0.22 : 0.1,
          shadowRadius: 16,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="items-center justify-center rounded-full"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              height: 32,
              width: 32,
            }}
          >
            <Text className="text-[15px] font-extrabold" style={{ color: theme.text }}>
              {title}
            </Text>
          </View>

          <Text className="text-[14px] font-bold" style={{ color: theme.text }}>
            {countLabel}
          </Text>
        </View>

        <Text className="text-[12px] font-semibold" style={{ color: theme.textMuted }}>
          Grupo
        </Text>
      </View>
    </View>
  );
}

function SubscriptionCardSkeleton() {
  const { theme } = useAppTheme();

  return (
    <Panel style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
      <View className="flex-row items-center gap-4">
        <SkeletonBlock borderRadius={28} height={56} width={56} />

        <View className="flex-1 gap-3">
          <View className="flex-row items-start gap-4">
            <SkeletonBlock borderRadius={999} height={16} width="62%" />
            <View
              className="rounded-full"
              style={{
                backgroundColor: theme.surfaceAlt,
                height: 30,
                width: 50,
              }}
            />
          </View>

          <SkeletonText lineHeight={11} lines={2} widths={['82%', '58%']} />
        </View>
      </View>
    </Panel>
  );
}

export default function SubscriptionsScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlashListRef<SubscriptionScreenListItem> | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SubscriptionSort>('name');
  const { handleScroll, hide, isVisible } = useScrollToTopButtonVisibility();
  const deferredSearch = useDeferredValue(search);
  const syncMutation = useSyncSubscriptions();
  const { data: subscriptionsData } = useLiveQuery(getAllSubscriptionsWithLatestPublishedAt());
  const { data: settingsData } = useLiveQuery(
    db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1),
  );
  const retainedSubscriptions = useRetainedLiveQueryData(subscriptionsData);
  const retainedSettings = useRetainedLiveQueryData(settingsData);
  const subscriptions = retainedSubscriptions.data ?? [];
  const settings = retainedSettings.data?.[0] ?? null;
  const groupedList = buildSubscriptionListData(subscriptions, deferredSearch, sort);
  const activeCount = subscriptions.filter(
    (subscription) => subscription.isActive && !subscription.unsubscribedAt,
  ).length;
  const totalCount = subscriptions.length;
  const visibleCount = groupedList.visibleCount;
  const lastSyncLabel = formatRelativeTime(settings?.lastSubsSyncAt ?? null, 'nunca');
  const hasSearch = search.trim().length > 0;
  const isInitialLoading =
    retainedSubscriptions.isInitialLoading || retainedSettings.isInitialLoading;
  const showLoadingOverlay =
    !isInitialLoading && (retainedSubscriptions.isRefreshing || retainedSettings.isRefreshing);
  const listData: SubscriptionScreenListItem[] = isInitialLoading
    ? SUBSCRIPTION_SKELETON_ITEMS
    : groupedList.items;

  const handleRefresh = () => {
    if (syncMutation.isPending) {
      return;
    }

    void syncMutation.mutateAsync();
  };

  const handleToggle = (channelId: string, isActive: boolean) => {
    void toggleSubscriptionActive(channelId, isActive);
  };

  const handleScrollToTop = () => {
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
    hide();
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: theme.background, flex: 1 }}>
      <View style={{ backgroundColor: theme.background, flex: 1, position: 'relative' }}>
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

        <View
          style={{
            gap: 14,
            paddingBottom: 8,
            paddingHorizontal: 20,
            paddingTop: insets.top + 14,
          }}
        >
          {isInitialLoading ? (
            <SubscriptionsSummarySkeleton />
          ) : (
            <Panel style={{ gap: 16 }}>
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1 gap-2">
                  <Text className="text-[13px] font-semibold uppercase tracking-[1.4px]" style={{ color: theme.textMuted }}>
                    Curadoria de canais
                  </Text>
                  <Text className="text-[30px] font-extrabold leading-[36px]" style={{ color: theme.text }}>
                    {`${activeCount} Ativas`}
                  </Text>
                  <Text className="text-[15px] leading-6" style={{ color: theme.textSoft }}>
                    {`${totalCount} inscrições sincronizadas`}
                  </Text>
                  <Text className="text-[13px] font-medium" style={{ color: theme.textMuted }}>
                    {`Última sync: ${lastSyncLabel}`}
                  </Text>
                </View>

                <Button
                  disabled={syncMutation.isPending}
                  label="Sincronizar"
                  loading={syncMutation.isPending}
                  onPress={handleRefresh}
                  size="sm"
                  variant="primary"
                />
              </View>
            </Panel>
          )}

          {isInitialLoading ? (
            <SubscriptionsControlsSkeleton />
          ) : (
            <Panel style={{ gap: 14, padding: 14 }}>
              <View
                className="flex-row items-center gap-3 rounded-[20px] px-4 py-3"
                style={{
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Ionicons color={theme.textMuted} name="search-outline" size={18} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-[15px]"
                  onChangeText={setSearch}
                  placeholder="Buscar canais por nome"
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="search"
                  style={{ color: theme.text }}
                  value={search}
                />
                {hasSearch ? (
                  <Ionicons
                    color={theme.textMuted}
                    name="close-circle"
                    onPress={() => setSearch('')}
                    size={18}
                  />
                ) : null}
              </View>

              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[12px] font-bold uppercase tracking-[1.2px]"
                  style={{ color: theme.textMuted }}
                >
                  Ordenar
                </Text>
                <Text className="text-[12px] font-semibold" style={{ color: theme.textSoft }}>
                  {sort === 'name' ? 'A-Z' : 'Mais recentes'}
                </Text>
              </View>

              <SegmentedControl
                onChange={setSort}
                options={SORT_OPTIONS}
                tone="neutral"
                value={sort}
              />

              <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                {sort === 'name'
                  ? `Mostrando ${visibleCount} de ${totalCount} canais, agrupados por letra.`
                  : `Mostrando ${visibleCount} de ${totalCount} canais, em ordem de publicação mais recente.`}
              </Text>
            </Panel>
          )}
        </View>

        <FlashList
          contentContainerStyle={{
            paddingBottom: insets.bottom + 116,
            paddingHorizontal: 20,
            paddingTop: 6,
          }}
          data={listData}
          drawDistance={520}
          extraData={sort}
          getItemType={(item) => item.kind}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          keyExtractor={(item) => item.key}
          ListEmptyComponent={
            isInitialLoading ? null : (
              <View style={{ paddingTop: 24 }}>
                {totalCount === 0 ? (
                  <EmptyState
                    ctaLabel="Sincronizar agora"
                    description="Conecte sua conta ao YouTube e puxe suas inscrições para começar a curadoria."
                    icon="sync-outline"
                    onCta={handleRefresh}
                    title="Nenhuma inscrição sincronizada"
                  />
                ) : (
                  <EmptyState
                    description="Tente outro nome ou sincronize novamente a lista de canais."
                    icon="search-outline"
                    title="Nenhum canal encontrado"
                  />
                )}
              </View>
            )
          }
          onScroll={handleScroll}
          onRefresh={handleRefresh}
          ref={listRef}
          refreshing={syncMutation.isPending}
          renderItem={({ item }) => {
            if (item.kind === 'skeleton') {
              return <SubscriptionCardSkeleton />;
            }

            if (item.kind === 'section') {
              return <SubscriptionSectionHeader count={item.count} title={item.title} />;
            }

            return (
              <SubscriptionCard
                detailLabel={formatSubscriptionDetail(item.subscription)}
                onToggle={handleToggle}
                subscription={item.subscription}
              />
            );
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        />

        <ScrollToTopButton onPress={handleScrollToTop} visible={isVisible} />
        {showLoadingOverlay ? <ListLoadingOverlay label="Atualizando inscrições" /> : null}
      </View>
    </SafeAreaView>
  );
}
