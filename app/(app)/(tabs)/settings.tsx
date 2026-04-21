import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { db, schema } from '@/db/client';
import { updateSettings } from '@/db/queries/settings';
import type { JobRun } from '@/db/schema';
import { deleteAccountLocally, signOut, useSession } from '@/features/auth/session';
import {
  cancelDailyReminder,
  requestNotificationPermission,
  scheduleDailyReminder,
} from '@/features/notifications/daily-reminder';
import { cleanOldWatched } from '@/features/library/maintenance';
import { useSyncSubscriptions } from '@/features/subscriptions/hooks';
import { getTodayDateString } from '@/features/timeline/planner';
import { formatMinutes } from '@/shared/lib/formatters';
import { useThemePreference, useResolvedScheme } from '@/shared/hooks/useThemePreference';
import { useRetainedLiveQueryData } from '@/shared/hooks/useRetainedLiveQueryData';
import { useAppTheme } from '@/shared/theme/provider';
import { SecondaryButton, TertiaryButton } from '@/shared/ui/buttons';
import {
  AppScrollScreen,
  MetricCard,
  Panel,
  ScreenHeader,
  SectionHeading,
  Tag,
} from '@/shared/ui/layout';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { ListLoadingOverlay, SkeletonBlock, SkeletonText } from '@/shared/ui/skeleton';

const THEME_OPTIONS = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
] as const;

const MAX_SUBS_MIN = 5;
const MAX_SUBS_MAX = 100;
const MAX_SUBS_STEP = 5;
const DAILY_TARGET_MIN = 30;
const DAILY_TARGET_MAX = 600;
const DAILY_TARGET_STEP = 30;
const VIDEOS_PER_SUB_MIN = 1;
const VIDEOS_PER_SUB_MAX = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatRelativeTime(timestamp: number | null) {
  if (!timestamp) {
    return 'Nunca';
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) {
    return 'Agora';
  }

  if (diffMinutes < 60) {
    return `Há ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Há ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 30) {
    return `Há ${diffDays} d`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `Há ${Math.max(diffMonths, 1)} mês${diffMonths === 1 ? '' : 'es'}`;
}

function getLastRunTimestamp(lastJobRun: JobRun | null, fallback: number | null) {
  if (!lastJobRun) {
    return fallback;
  }

  return lastJobRun.finishedAt ?? lastJobRun.startedAt;
}

function SettingsPanelSkeleton() {
  return (
    <Panel style={{ gap: 16 }}>
      <View className="gap-4 rounded-[22px] p-4">
        <SkeletonBlock borderRadius={999} height={16} width="36%" />
        <SkeletonText lineHeight={12} lines={3} widths={['92%', '84%', '58%']} />
      </View>
    </Panel>
  );
}

function SettingsLoadingScreen() {
  return (
    <AppScrollScreen>
      <ScreenHeader
        eyebrow="Configurações"
        subtitle="Conta, aparência e ajustes do seu feed."
        title="Tudo no seu lugar."
      />

      <View className="gap-4">
        <SectionHeading eyebrow="Conta" title="Conta" />
        <Panel style={{ gap: 16 }}>
          <View className="flex-row items-center gap-4">
            <SkeletonBlock borderRadius={24} height={68} width={68} />
            <View className="flex-1 gap-2">
              <SkeletonBlock borderRadius={999} height={18} width="48%" />
              <SkeletonBlock borderRadius={999} height={12} width="64%" />
            </View>
            <SkeletonBlock borderRadius={999} height={28} width={72} />
          </View>

          <SkeletonBlock borderRadius={20} height={48} width="100%" />
        </Panel>
      </View>

      <View className="gap-4">
        <SectionHeading eyebrow="Preferências" title="Aparência" />
        <SettingsPanelSkeleton />
      </View>

      <View className="gap-4">
        <SectionHeading eyebrow="Timeline" title="Quanto cabe no seu dia" />
        <SettingsPanelSkeleton />
      </View>

      <View className="gap-4">
        <SectionHeading eyebrow="Sincronização" title="Feed e inscrições" />
        <SettingsPanelSkeleton />
      </View>
    </AppScrollScreen>
  );
}

function SettingsSolidButton({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={{ width: '100%' }}
    >
      {({ pressed }) => (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: loading ? theme.surfaceMuted : pressed ? theme.primary : theme.primaryPressed,
            borderColor: loading ? theme.border : theme.primaryPressed,
            borderRadius: 16,
            borderWidth: 1,
            elevation: loading ? 0 : 2,
            justifyContent: 'center',
            minHeight: 52,
            opacity: loading ? 0.65 : 1,
            paddingHorizontal: 18,
            paddingVertical: 12,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: loading ? 0 : theme.dark ? 0.24 : 0.12,
            shadowRadius: 18,
            width: '100%',
          }}
        >
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{label}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const session = useSession();
  const [isCleaningWatched, setIsCleaningWatched] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [trendingRegionInput, setTrendingRegionInput] = useState('BR');
  const [maxSubsTrackWidth, setMaxSubsTrackWidth] = useState(0);
  const { theme } = useAppTheme();
  const { preference, setPreference } = useThemePreference();
  const resolvedScheme = useResolvedScheme();
  const syncMutation = useSyncSubscriptions();
  const { data: settingsData } = useLiveQuery(
    db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1),
  );
  const { data: lastJobRunData } = useLiveQuery(
    db.select().from(schema.jobRuns).orderBy(desc(schema.jobRuns.startedAt)).limit(1),
  );
  const todayDate = getTodayDateString();
  const { data: todayPlanData } = useLiveQuery(
    db.select().from(schema.dailyPlans).where(eq(schema.dailyPlans.planDate, todayDate)).limit(1),
  );
  const retainedSettings = useRetainedLiveQueryData(settingsData);
  const retainedLastJobRun = useRetainedLiveQueryData(lastJobRunData);
  const retainedTodayPlan = useRetainedLiveQueryData(todayPlanData);

  const jobSettings = retainedSettings.data?.[0] ?? null;
  const todayPlan = retainedTodayPlan.data?.[0] ?? null;
  const lastJobRun = retainedLastJobRun.data?.[0] ?? null;
  const lastJobRunTimestamp = getLastRunTimestamp(lastJobRun, jobSettings?.lastJobRunAt ?? null);
  const dailyTargetMins = clamp(jobSettings?.dailyTargetHours ?? 120, DAILY_TARGET_MIN, DAILY_TARGET_MAX);
  const canIncrease = dailyTargetMins < DAILY_TARGET_MAX;
  const canDecrease = dailyTargetMins > DAILY_TARGET_MIN;
  const lastSyncLabel = formatRelativeTime(jobSettings?.lastSubsSyncAt ?? null);
  const maxSubsPerJob = jobSettings?.maxSubsPerJob ?? 25;
  const videosPerSub = jobSettings?.videosPerSub ?? 5;
  const includeTrending = jobSettings?.includeTrending ?? false;
  const trendingRegionCode = jobSettings?.trendingRegionCode ?? 'BR';
  const notificationsEnabled = jobSettings?.notificationsEnabled ?? false;
  const notificationHour = jobSettings?.notificationHour ?? 7;
  const maxSubsRatio =
    (clamp(maxSubsPerJob, MAX_SUBS_MIN, MAX_SUBS_MAX) - MAX_SUBS_MIN) /
    (MAX_SUBS_MAX - MAX_SUBS_MIN);
  const maxSubsKnobLeft = Math.max(
    0,
    Math.min(Math.max(maxSubsTrackWidth - 24, 0), maxSubsRatio * maxSubsTrackWidth - 12),
  );
  const isInitialLoading =
    retainedSettings.isInitialLoading ||
    retainedLastJobRun.isInitialLoading ||
    retainedTodayPlan.isInitialLoading;
  const showLoadingOverlay =
    !isInitialLoading &&
    (retainedSettings.isRefreshing ||
      retainedLastJobRun.isRefreshing ||
      retainedTodayPlan.isRefreshing);

  useEffect(() => {
    setTrendingRegionInput(trendingRegionCode);
  }, [trendingRegionCode]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/sign-in');
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Excluir conta',
      'Todos os seus dados locais serão apagados permanentemente. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir tudo',
          style: 'destructive',
          onPress: async () => {
            await deleteAccountLocally();
            router.replace('/sign-in');
          },
        },
      ]
    );
  };

  const runWatchedCleanup = async () => {
    setIsCleaningWatched(true);

    try {
      const removed = cleanOldWatched(30);

      Alert.alert(
        'Limpeza concluída',
        removed === 1
          ? '1 vídeo assistido há mais de 30 dias foi apagado.'
          : `${removed} vídeos assistidos há mais de 30 dias foram apagados.`,
      );
    } catch {
      Alert.alert('Falha na limpeza', 'Não foi possível apagar os assistidos antigos. Tente novamente.');
    } finally {
      setIsCleaningWatched(false);
    }
  };

  const handleWatchedCleanup = () => {
    if (isCleaningWatched) {
      return;
    }

    Alert.alert(
      'Apagar assistidos antigos',
      'Isso remove permanentemente do aparelho os vídeos assistidos há mais de 30 dias que não estão em nenhum plano ativo. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            void runWatchedCleanup();
          },
        },
      ],
    );
  };

  const handleMaxSubsTrackPress = (locationX: number) => {
    if (!jobSettings || maxSubsTrackWidth <= 0) {
      return;
    }

    const ratio = clamp(locationX / maxSubsTrackWidth, 0, 1);
    const rawValue = MAX_SUBS_MIN + ratio * (MAX_SUBS_MAX - MAX_SUBS_MIN);
    const steppedValue =
      Math.round((rawValue - MAX_SUBS_MIN) / MAX_SUBS_STEP) * MAX_SUBS_STEP + MAX_SUBS_MIN;
    const nextValue = clamp(steppedValue, MAX_SUBS_MIN, MAX_SUBS_MAX);

    if (nextValue !== maxSubsPerJob) {
      void updateSettings({ maxSubsPerJob: nextValue });
    }
  };

  const handleTrendingRegionBlur = () => {
    const sanitized = trendingRegionInput.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);

    if (!sanitized) {
      setTrendingRegionInput(trendingRegionCode);
      return;
    }

    if (sanitized !== trendingRegionCode) {
      void updateSettings({ trendingRegionCode: sanitized });
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permissão negada',
          'Ative as notificações nas configurações do sistema para usar esse recurso.',
        );
        return;
      }
      await updateSettings({ notificationsEnabled: true });
      await scheduleDailyReminder(notificationHour);
    } else {
      await updateSettings({ notificationsEnabled: false });
      await cancelDailyReminder();
    }
  };

  const handleNotificationHourChange = async (hour: number) => {
    const safeHour = Math.max(0, Math.min(23, hour));
    await updateSettings({ notificationHour: safeHour });
    if (notificationsEnabled) {
      await scheduleDailyReminder(safeHour);
    }
  };

  const handleDailyTargetChange = (nextMinutes: number) => {
    if (!jobSettings) {
      return;
    }

    const safeMins = clamp(nextMinutes, DAILY_TARGET_MIN, DAILY_TARGET_MAX);

    if (safeMins === dailyTargetMins) {
      return;
    }

    Alert.alert(
      'Meta diária',
      `Alterar para ${formatMinutes(safeMins)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void updateSettings({ dailyTargetHours: safeMins }) },
      ],
    );
  };

  const displayName = session?.name ?? session?.email ?? '—';
  const displayEmail = session?.email ?? '';
  const avatarUrl = session?.avatarUrl ?? null;
  const initial = displayName.charAt(0).toUpperCase();

  const screen = (
    <View style={{ flex: 1 }}>
      <AppScrollScreen>
        <ScreenHeader
          eyebrow="Configurações"
          subtitle="Conta, aparência e ajustes do seu feed."
          title="Tudo no seu lugar."
        />

        <View className="gap-4">
          <SectionHeading eyebrow="Conta" title={displayName} />

          <Panel style={{ gap: 16 }}>
            <View className="flex-row items-center gap-4">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    borderRadius: 24,
                    height: 68,
                    width: 68,
                  }}
                  transition={120}
                />
              ) : (
                <View
                  className="items-center justify-center rounded-[24px]"
                  style={{ backgroundColor: theme.primary, height: 68, width: 68 }}
                >
                  <Text className="text-[24px] font-extrabold text-white">{initial}</Text>
                </View>
              )}

              <View className="flex-1 gap-1">
                <Text className="text-[20px] font-extrabold" style={{ color: theme.text }}>
                  {displayName}
                </Text>
                <Text className="text-[14px]" style={{ color: theme.textSoft }}>
                  {displayEmail}
                </Text>
              </View>

              <Tag label="Google" tone="accent" />
            </View>

            <SecondaryButton
              disabled={signingOut}
              fullWidth
              label={signingOut ? 'Saindo…' : 'Sair'}
              onPress={handleSignOut}
            />
            <TertiaryButton label="Excluir conta e dados locais" onPress={handleDeleteAccount} />
          </Panel>
        </View>

        <View className="gap-4">
          <SectionHeading eyebrow="Preferências" title="Aparência" />

          <Panel style={{ gap: 16 }}>
            <View className="gap-3 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
              <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                Tema
              </Text>
              <SegmentedControl onChange={setPreference} options={THEME_OPTIONS} value={preference} />
              <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                {resolvedScheme === 'dark' ? 'Modo escuro ativo.' : 'Modo claro ativo.'}
              </Text>
            </View>
          </Panel>
        </View>

        <View className="gap-4">
          <SectionHeading eyebrow="Timeline" title="Quanto cabe no seu dia" />

          <Panel style={{ gap: 16 }}>
            <View className="gap-4 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                  Meta diaria
                </Text>
                <Text className="text-[18px] font-extrabold" style={{ color: theme.primary }}>
                  {formatMinutes(dailyTargetMins)}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Pressable
                  className="items-center justify-center rounded-[18px]"
                  disabled={!canDecrease}
                  onPress={() => handleDailyTargetChange(dailyTargetMins - DAILY_TARGET_STEP)}
                  style={{
                    backgroundColor: theme.surface,
                    height: 48,
                    opacity: canDecrease ? 1 : 0.4,
                    width: 48,
                  }}
                >
                  <Text className="text-[24px] font-bold" style={{ color: theme.text }}>
                    -
                  </Text>
                </Pressable>

                <View
                  className="flex-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: theme.surface, height: 8 }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: theme.primary,
                      width: `${((dailyTargetMins - DAILY_TARGET_MIN) / (DAILY_TARGET_MAX - DAILY_TARGET_MIN)) * 100}%`,
                    }}
                  />
                </View>

                <Pressable
                  className="items-center justify-center rounded-[18px]"
                  disabled={!canIncrease}
                  onPress={() => handleDailyTargetChange(dailyTargetMins + DAILY_TARGET_STEP)}
                  style={{
                    backgroundColor: canIncrease ? theme.primary : theme.surface,
                    height: 48,
                    opacity: canIncrease ? 1 : 0.4,
                    width: 48,
                  }}
                >
                  <Text
                    className="text-[24px] font-bold"
                    style={{ color: canIncrease ? '#FFFFFF' : theme.textMuted }}
                  >
                    +
                  </Text>
                </Pressable>
              </View>

              <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                A mudanca nao afeta o plano do dia atual. Ela passa a valer a partir de amanha.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <MetricCard
                accent={theme.primary}
                hint="meta usada para gerar os proximos dias"
                label="Meta"
                value={formatMinutes(dailyTargetMins)}
              />
              <MetricCard
                accent={theme.accent}
                hint="snapshot salvo para a timeline atual"
                label="Hoje"
                value={todayPlan ? formatMinutes(todayPlan.targetMinutes) : 'Sem plano'}
              />
            </View>
          </Panel>
        </View>

        <View className="gap-4">
          <SectionHeading eyebrow="Sincronização" title="Feed e inscrições" />

          <Panel style={{ gap: 14 }}>
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1 gap-2">
                <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                  Última sync
                </Text>
                <Text className="text-[14px] leading-6" style={{ color: theme.textSoft }}>
                  {lastSyncLabel}
                </Text>
              </View>
              <Tag label={lastSyncLabel} tone="accent" />
            </View>

            <SettingsSolidButton
              label={syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar agora'}
              loading={syncMutation.isPending}
              onPress={() => {
                if (!syncMutation.isPending) {
                  syncMutation.mutate();
                }
              }}
            />
          </Panel>
        </View>

        <View className="gap-4">
          <SectionHeading eyebrow="Job de busca" title="Coleta de vídeos" />

          <Panel style={{ gap: 16 }}>
            <View className="gap-4 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                    Máximo de canais por execução
                  </Text>
                  <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                    O job escolhe canais aleatórios até este teto.
                  </Text>
                </View>
                <Text className="text-[20px] font-extrabold" style={{ color: theme.primary }}>
                  {maxSubsPerJob}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Pressable
                  className="items-center justify-center rounded-[18px]"
                  disabled={!jobSettings || maxSubsPerJob <= MAX_SUBS_MIN}
                  onPress={() => {
                    void updateSettings({
                      maxSubsPerJob: clamp(maxSubsPerJob - MAX_SUBS_STEP, MAX_SUBS_MIN, MAX_SUBS_MAX),
                    });
                  }}
                  style={{
                    backgroundColor: theme.surface,
                    height: 44,
                    opacity: !jobSettings || maxSubsPerJob <= MAX_SUBS_MIN ? 0.4 : 1,
                    width: 44,
                  }}
                >
                  <Text className="text-[24px] font-bold" style={{ color: theme.text }}>
                    −
                  </Text>
                </Pressable>

                <Pressable
                  className="flex-1 justify-center"
                  onLayout={(event) => setMaxSubsTrackWidth(event.nativeEvent.layout.width)}
                  onPress={(event) => {
                    handleMaxSubsTrackPress(event.nativeEvent.locationX);
                  }}
                  style={{ height: 36 }}
                >
                  <View
                    className="rounded-full"
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      borderWidth: 1,
                      height: 10,
                    }}
                  />
                  <View
                    className="absolute rounded-full"
                    style={{
                      backgroundColor: theme.primary,
                      height: 10,
                      width: `${maxSubsRatio * 100}%`,
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      backgroundColor: theme.primary,
                      borderColor: theme.surface,
                      borderRadius: 999,
                      borderWidth: 3,
                      height: 24,
                      left: maxSubsKnobLeft,
                      position: 'absolute',
                      top: 6,
                      width: 24,
                    }}
                  />
                </Pressable>

                <Pressable
                  className="items-center justify-center rounded-[18px]"
                  disabled={!jobSettings || maxSubsPerJob >= MAX_SUBS_MAX}
                  onPress={() => {
                    void updateSettings({
                      maxSubsPerJob: clamp(maxSubsPerJob + MAX_SUBS_STEP, MAX_SUBS_MIN, MAX_SUBS_MAX),
                    });
                  }}
                  style={{
                    backgroundColor: theme.primary,
                    height: 44,
                    opacity: !jobSettings || maxSubsPerJob >= MAX_SUBS_MAX ? 0.4 : 1,
                    width: 44,
                  }}
                >
                  <Text className="text-[24px] font-bold text-white">+</Text>
                </Pressable>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>
                  {MAX_SUBS_MIN}
                </Text>
                <Text className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>
                  {MAX_SUBS_MAX}
                </Text>
              </View>
            </View>

            <View className="gap-4 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                    Vídeos por canal
                  </Text>
                  <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                    Define quantos vídeos novos cada inscrição pode trazer por run.
                  </Text>
                </View>
                <Text className="text-[20px] font-extrabold" style={{ color: theme.primary }}>
                  {videosPerSub}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Pressable
                  className="items-center justify-center rounded-[18px]"
                  disabled={!jobSettings || videosPerSub <= VIDEOS_PER_SUB_MIN}
                  onPress={() => {
                    void updateSettings({
                      videosPerSub: clamp(videosPerSub - 1, VIDEOS_PER_SUB_MIN, VIDEOS_PER_SUB_MAX),
                    });
                  }}
                  style={{
                    backgroundColor: theme.surface,
                    height: 48,
                    opacity: !jobSettings || videosPerSub <= VIDEOS_PER_SUB_MIN ? 0.4 : 1,
                    width: 48,
                  }}
                >
                  <Text className="text-[24px] font-bold" style={{ color: theme.text }}>
                    −
                  </Text>
                </Pressable>

                <View
                  className="flex-1 rounded-[20px] px-4 py-3"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }}
                >
                  <Text className="text-[18px] font-extrabold" style={{ color: theme.text }}>
                    {videosPerSub} por canal
                  </Text>
                  <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                    Intervalo disponível: {VIDEOS_PER_SUB_MIN} a {VIDEOS_PER_SUB_MAX}
                  </Text>
                </View>

                <Pressable
                  className="items-center justify-center rounded-[18px]"
                  disabled={!jobSettings || videosPerSub >= VIDEOS_PER_SUB_MAX}
                  onPress={() => {
                    void updateSettings({
                      videosPerSub: clamp(videosPerSub + 1, VIDEOS_PER_SUB_MIN, VIDEOS_PER_SUB_MAX),
                    });
                  }}
                  style={{
                    backgroundColor: theme.primary,
                    height: 48,
                    opacity: !jobSettings || videosPerSub >= VIDEOS_PER_SUB_MAX ? 0.4 : 1,
                    width: 48,
                  }}
                >
                  <Text className="text-[24px] font-bold text-white">+</Text>
                </Pressable>
              </View>
            </View>

            <View className="gap-4 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                    Incluir trending
                  </Text>
                  <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                    Adiciona vídeos populares da região escolhida, sem furar a FK de inscrições.
                  </Text>
                </View>
                <Switch
                  onValueChange={(value) => {
                    void updateSettings({ includeTrending: value });
                  }}
                  trackColor={{ false: theme.surfaceMuted, true: theme.primarySoft }}
                  value={includeTrending}
                />
              </View>

              {includeTrending ? (
                <View className="gap-2">
                  <Text className="text-[13px] font-semibold" style={{ color: theme.text }}>
                    Região do trending
                  </Text>
                  <TextInput
                    autoCapitalize="characters"
                    autoCorrect={false}
                    className="rounded-[18px] px-4 py-3 text-[16px] font-semibold"
                    maxLength={2}
                    onBlur={handleTrendingRegionBlur}
                    onChangeText={(value) => {
                      setTrendingRegionInput(value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2));
                    }}
                    placeholder="BR"
                    placeholderTextColor={theme.textMuted}
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      borderWidth: 1,
                      color: theme.text,
                    }}
                    value={trendingRegionInput}
                  />
                  <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                    Use um código ISO de país, como BR, US ou JP.
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="gap-3 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
              <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                Última execução
              </Text>
              <Text className="text-[18px] font-extrabold" style={{ color: theme.primary }}>
                {formatRelativeTime(lastJobRunTimestamp)}
              </Text>
              <Text className="text-[13px] leading-6" style={{ color: theme.textSoft }}>
                {lastJobRun
                  ? `${lastJobRun.subsProcessed ?? 0} canais processados, ${lastJobRun.videosAdded ?? 0} vídeos adicionados`
                  : 'Nenhum job executado ainda.'}
              </Text>
            </View>
          </Panel>
        </View>

        <View className="gap-4">
          <SectionHeading eyebrow="Notificações" title="Lembrete diário" />

          <Panel style={{ gap: 16 }}>
            <View className="gap-4 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                    Notificação diária
                  </Text>
                  <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                    Receba um lembrete para atualizar sua timeline.
                  </Text>
                </View>
                <Switch
                  onValueChange={(value) => {
                    void handleNotificationsToggle(value);
                  }}
                  trackColor={{ false: theme.surfaceMuted, true: theme.primarySoft }}
                  value={notificationsEnabled}
                />
              </View>

              {notificationsEnabled ? (
                <View className="gap-2">
                  <Text className="text-[13px] font-semibold" style={{ color: theme.text }}>
                    Horário do lembrete
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <Pressable
                        key={h}
                        onPress={() => void handleNotificationHourChange(h)}
                        style={{
                          alignItems: 'center',
                          backgroundColor: notificationHour === h ? theme.primary : theme.surface,
                          borderColor: theme.border,
                          borderRadius: 14,
                          borderWidth: 1,
                          justifyContent: 'center',
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                        }}
                      >
                        <Text
                          className="text-[14px] font-semibold"
                          style={{ color: notificationHour === h ? '#FFFFFF' : theme.text }}
                        >
                          {String(h).padStart(2, '0')}h
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
                    O sistema operacional pode ajustar o horário exato. Use a notificação como gatilho, não como garantia.
                  </Text>
                </View>
              ) : null}
            </View>
          </Panel>
        </View>

        <View className="gap-4">
          <SectionHeading eyebrow="Manutenção" title="Histórico local" />

          <Panel style={{ gap: 14 }}>
            <View className="gap-2">
              <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                Limpar assistidos antigos
              </Text>
              <Text className="text-[13px] leading-6" style={{ color: theme.textSoft }}>
                Apaga permanentemente vídeos assistidos há mais de 30 dias, exceto os que ainda participam de um plano ativo.
              </Text>
            </View>

            <SecondaryButton
              disabled={isCleaningWatched}
              fullWidth
              label="Apagar assistidos há mais de 30 dias"
              onPress={handleWatchedCleanup}
            />
          </Panel>
        </View>
      </AppScrollScreen>

      {showLoadingOverlay ? <ListLoadingOverlay label="Atualizando ajustes" top={18} /> : null}
    </View>
  );

  if (isInitialLoading) {
    return <SettingsLoadingScreen />;
  }

  return screen;
}
