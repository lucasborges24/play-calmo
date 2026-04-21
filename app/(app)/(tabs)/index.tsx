import { RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { db, schema } from '@/db/client';
import { useTodayPlan } from '@/db/queries/daily-plan';
import { useRunJob } from '@/features/jobs/hooks';
import { JobProgressModal } from '@/features/jobs/components/JobProgressModal';
import {
  excludeVideo,
  markAsWatched,
  removeFromToday,
} from '@/features/timeline/actions';
import { VideoCard } from '@/features/timeline/components/VideoCard';
import {
  getOrCreateTodayPlan,
  getPlanMarginBounds,
  getTodayDateString,
  refillPlan,
} from '@/features/timeline/planner';
import { formatCalendarLabel, formatMinutes } from '@/shared/lib/formatters';
import { useRetainedLiveQueryData } from '@/shared/hooks/useRetainedLiveQueryData';
import { useAppTheme } from '@/shared/theme/provider';
import { PrimaryButton, SecondaryButton } from '@/shared/ui/buttons';
import { EmptyState } from '@/shared/ui/empty-state';
import { Panel, Tag } from '@/shared/ui/layout';
import { ListLoadingOverlay, SkeletonBlock, SkeletonText } from '@/shared/ui/skeleton';

function isValidDailyTarget(minutes: number | null | undefined): minutes is number {
  return typeof minutes === 'number' && Number.isInteger(minutes) && minutes >= 30 && minutes <= 600;
}

type HomeSkeletonItem = {
  key: string;
  kind: 'skeleton';
};

const HOME_SKELETON_ITEMS: HomeSkeletonItem[] = Array.from({ length: 3 }, (_, index) => ({
  key: `home-skeleton-${index}`,
  kind: 'skeleton',
}));

function HomeLoadingHeader() {
  return (
    <View style={{ gap: 18, paddingBottom: 18 }}>
      <Panel style={{ gap: 18, padding: 20 }}>
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-3">
            <SkeletonBlock borderRadius={999} height={28} width={120} />
            <SkeletonText lineHeight={14} lines={3} widths={['82%', '74%', '56%']} />
          </View>
          <SkeletonBlock borderRadius={20} height={48} width={48} />
        </View>

        <View className="gap-4">
          <SkeletonBlock borderRadius={999} height={10} width="100%" />
          <View className="flex-row items-center justify-between gap-4">
            <SkeletonBlock borderRadius={999} height={12} width={116} />
            <SkeletonBlock borderRadius={999} height={12} width={110} />
          </View>
        </View>
      </Panel>
    </View>
  );
}

function HomeVideoCardSkeleton() {
  return (
    <Panel style={{ padding: 0 }}>
      <SkeletonBlock
        borderRadius={0}
        height={184}
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
      />

      <View style={{ gap: 8, padding: 14 }}>
        <View className="flex-row items-center gap-2">
          <SkeletonBlock borderRadius={999} height={24} width={92} />
          <SkeletonBlock borderRadius={999} height={24} width={64} />
        </View>

        <SkeletonText lineHeight={14} lines={3} widths={['100%', '88%', '66%']} />
        <SkeletonBlock borderRadius={999} height={12} width="42%" />
      </View>
    </Panel>
  );
}

function HomeLoadingScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

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
          data={HOME_SKELETON_ITEMS}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          keyExtractor={(item) => item.key}
          ListHeaderComponent={<HomeLoadingHeader />}
          renderItem={() => <HomeVideoCardSkeleton />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const runJobMutation = useRunJob();
  const ensureAttemptRef = useRef<string | null>(null);
  const refillAttemptRef = useRef<string | null>(null);
  const todayDate = getTodayDateString();
  const { data: settingsData } = useLiveQuery(
    db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1),
  );
  const retainedSettings = useRetainedLiveQueryData(settingsData);
  const {
    data: todayPlanData,
    isInitialLoading: isTodayPlanInitialLoading,
    isRefreshing: isTodayPlanRefreshing,
  } = useTodayPlan(todayDate);
  const settings = retainedSettings.data?.[0] ?? null;
  const plan = todayPlanData?.plan ?? null;
  const videos = todayPlanData?.videos ?? [];
  const hasValidTarget = isValidDailyTarget(settings?.dailyTargetHours);
  const targetMinutes = plan?.targetMinutes ?? (hasValidTarget ? settings.dailyTargetHours : 0);
  const targetSeconds = targetMinutes * 60;
  const totalSeconds = videos.reduce((sum, video) => sum + video.durationSeconds, 0);
  const bounds = getPlanMarginBounds(targetMinutes);
  const isWithinMargin =
    targetSeconds > 0 && totalSeconds >= bounds.lower && totalSeconds <= bounds.upper;
  const hasLittleContent = videos.length > 0 && targetSeconds > 0 && totalSeconds < bounds.lower;
  const progress = targetSeconds === 0 ? 0 : Math.min(100, (totalSeconds / targetSeconds) * 100);
  const progressColor = isWithinMargin ? theme.success : theme.primary;
  const isEnsuringPlan = !plan && ensureAttemptRef.current === todayDate;

  useEffect(() => {
    if (!hasValidTarget || isTodayPlanInitialLoading || plan || ensureAttemptRef.current === todayDate) {
      return;
    }

    ensureAttemptRef.current = todayDate;

    getOrCreateTodayPlan().catch(() => {
      Alert.alert('Nao foi possivel montar a timeline de hoje.', 'Tente novamente em instantes.');
      ensureAttemptRef.current = null;
    });
  }, [hasValidTarget, isTodayPlanInitialLoading, plan, todayDate]);

  useEffect(() => {
    if (!plan || !hasValidTarget || runJobMutation.isPending || totalSeconds >= bounds.lower) {
      return;
    }

    const refillKey = `${plan.id}:${totalSeconds}:${settings?.lastJobRunAt ?? 0}:${settings?.lastSubsSyncAt ?? 0}`;

    if (refillAttemptRef.current === refillKey) {
      return;
    }

    refillAttemptRef.current = refillKey;

    refillPlan(plan.id).catch(() => {
      refillAttemptRef.current = null;
    });
  }, [
    bounds.lower,
    hasValidTarget,
    plan,
    runJobMutation.isPending,
    settings?.lastJobRunAt,
    settings?.lastSubsSyncAt,
    totalSeconds,
  ]);

  const handleRunJob = async () => {
    if (runJobMutation.isPending) {
      return;
    }

    try {
      const result = await runJobMutation.mutateAsync('manual');

      if (plan) {
        await refillPlan(plan.id);
      } else if (hasValidTarget) {
        await getOrCreateTodayPlan();
      }

      if (result.cancelled) {
        Alert.alert(
          'Sincronização cancelada.',
          'Os vídeos encontrados até o momento foram mantidos.',
        );
      }
    } catch {
      Alert.alert('Falha ao executar o job.', 'Confira sua conexao e tente novamente.');
    }
  };

  const handleMarkWatched = async (videoId: string) => {
    try {
      await markAsWatched(videoId);
    } catch {
      Alert.alert('Nao foi possivel marcar como visto.', 'Tente novamente.');
    }
  };

  const handleRemoveFromToday = async (videoId: string) => {
    try {
      await removeFromToday(videoId);
    } catch {
      Alert.alert('Nao foi possivel remover do dia.', 'Tente novamente.');
    }
  };

  const handleExclude = async (videoId: string) => {
    try {
      await excludeVideo(videoId);
    } catch {
      Alert.alert('Nao foi possivel excluir o video.', 'Tente novamente.');
    }
  };

  const isInitialLoading =
    retainedSettings.isInitialLoading ||
    (hasValidTarget && ((!todayPlanData && isTodayPlanInitialLoading) || (isEnsuringPlan && !todayPlanData)));
  const showLoadingOverlay =
    !isInitialLoading && (retainedSettings.isRefreshing || isTodayPlanRefreshing);

  if (isInitialLoading) {
    return <HomeLoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
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

          <FlashList
            contentContainerStyle={{
              paddingBottom: insets.bottom + 116,
              paddingHorizontal: 20,
              paddingTop: insets.top + 14,
            }}
            data={videos}
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
            keyExtractor={(item) => `${item.dailyPlanVideoId}`}
            ListEmptyComponent={
              hasValidTarget ? (
                <View style={{ paddingTop: 8 }}>
                  <EmptyState
                    ctaLabel="Rodar job agora"
                    description="Sem videos planejados. Rode o job pra buscar novos."
                    icon="today-outline"
                    onCta={() => {
                      void handleRunJob();
                    }}
                    title="Nada para hoje"
                  />
                </View>
              ) : null
            }
            ListHeaderComponent={
              <View style={{ gap: 18, paddingBottom: 18 }}>
                <Panel style={{ gap: 18, padding: 20 }}>
                  <View className="flex-row items-start justify-between gap-4">
                    <View className="flex-1 gap-3">
                      <View className="flex-row items-center gap-2">
                        <Tag label="Hoje" tone="accent" />
                        <Text className="text-[14px]" style={{ color: theme.textSoft }}>
                          {formatCalendarLabel()}
                        </Text>
                      </View>
                      <View className="gap-2">
                        <Text className="text-[30px] font-extrabold leading-[36px]" style={{ color: theme.text }}>
                          Sua timeline do dia.
                        </Text>
                        <Text className="text-[15px] leading-6" style={{ color: theme.textSoft }}>
                          {hasValidTarget
                            ? `${formatMinutes(Math.round(totalSeconds / 60))} de ${formatMinutes(targetMinutes)}`
                            : 'Defina sua meta diaria para gerar a selecao de hoje.'}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      className="items-center justify-center rounded-[20px]"
                      disabled={runJobMutation.isPending}
                      onPress={() => {
                        void handleRunJob();
                      }}
                      testID="today-sync-button"
                      style={{
                        backgroundColor: theme.surfaceAlt,
                        borderColor: theme.border,
                        borderWidth: 1,
                        height: 48,
                        opacity: runJobMutation.isPending ? 0.6 : 1,
                        width: 48,
                      }}
                    >
                      {runJobMutation.isPending ? (
                        <ActivityIndicator color={theme.primary} size="small" />
                      ) : (
                        <RefreshCw color={theme.text} size={20} />
                      )}
                    </Pressable>
                  </View>

                  {hasValidTarget ? (
                    <View className="gap-4">
                      <View
                        className="overflow-hidden rounded-full"
                        style={{ backgroundColor: theme.surfaceAlt, height: 10 }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: progressColor,
                            width: `${progress}%`,
                          }}
                        />
                      </View>

                      <View className="flex-row items-center justify-between gap-4">
                        <Text className="text-[12px] font-semibold" style={{ color: theme.textMuted }}>
                          {`${videos.length} video${videos.length === 1 ? '' : 's'} planejado${videos.length === 1 ? '' : 's'}`}
                        </Text>
                        <Text className="text-[12px] font-semibold" style={{ color: theme.textMuted }}>
                          {isWithinMargin ? 'Dentro da margem' : 'Fora da margem'}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </Panel>

                {!hasValidTarget ? (
                  <Panel style={{ gap: 14 }}>
                    <Text className="text-[20px] font-extrabold" style={{ color: theme.text }}>
                      Defina sua meta diaria
                    </Text>
                    <Text className="text-[14px] leading-6" style={{ color: theme.textSoft }}>
                      A timeline de hoje precisa de uma meta valida entre 1h e 10h.
                    </Text>
                    <View className="flex-row gap-3">
                      <PrimaryButton
                        fullWidth
                        label="Usar 2h por dia"
                        onPress={() => {
                          void db
                            .update(schema.settings)
                            .set({ dailyTargetHours: 120 })
                            .where(eq(schema.settings.id, 1));
                        }}
                      />
                    </View>
                    <SecondaryButton
                      fullWidth
                      label="Abrir configuracoes"
                      onPress={() => router.push('/(app)/(tabs)/settings')}
                    />
                  </Panel>
                ) : null}

                {hasLittleContent ? (
                  <Panel style={{ gap: 10 }}>
                    <Tag label="Pouco conteudo" tone="accent" />
                    <Text className="text-[14px] leading-6" style={{ color: theme.textSoft }}>
                      O app usou tudo o que havia disponivel por enquanto. Rode o job para tentar completar mais perto da meta.
                    </Text>
                  </Panel>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <VideoCard
                onExclude={handleExclude}
                onMarkWatched={handleMarkWatched}
                onRemoveFromToday={handleRemoveFromToday}
                video={item}
              />
            )}
            showsVerticalScrollIndicator={false}
          />

          {showLoadingOverlay ? <ListLoadingOverlay label="Atualizando timeline" /> : null}
        </View>
      </SafeAreaView>

      <JobProgressModal
        isCancelling={runJobMutation.isCancelling}
        onCancel={runJobMutation.cancel}
        progress={runJobMutation.progress}
        visible={runJobMutation.isPending}
      />
    </View>
  );
}
