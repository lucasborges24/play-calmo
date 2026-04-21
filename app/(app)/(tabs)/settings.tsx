import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, Switch, Text, TextInput, View } from 'react-native';

import { db, schema } from '@/db/client';
import { updateSettings } from '@/db/queries/settings';
import type { JobRun } from '@/db/schema';
import { deleteAccountLocally, signOut, useSession } from '@/features/auth/session';
import { formatMinutes } from '@/shared/lib/formatters';
import { useDemoStore } from '@/shared/state/demo-store';
import { useThemePreference, useResolvedScheme } from '@/shared/hooks/useThemePreference';
import { useAppTheme } from '@/shared/theme/provider';
import { PrimaryButton, SecondaryButton, TertiaryButton } from '@/shared/ui/buttons';
import {
  AppScrollScreen,
  MetricCard,
  Panel,
  ScreenHeader,
  SectionHeading,
  Tag,
} from '@/shared/ui/layout';
import { SegmentedControl } from '@/shared/ui/segmented-control';

const THEME_OPTIONS = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
] as const;

const MAX_SUBS_MIN = 5;
const MAX_SUBS_MAX = 100;
const MAX_SUBS_STEP = 5;
const VIDEOS_PER_SUB_MIN = 1;
const VIDEOS_PER_SUB_MAX = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatRelativeTime(timestamp: number | null) {
  if (!timestamp) {
    return 'nunca';
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

  if (diffDays < 30) {
    return `há ${diffDays} d`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `há ${Math.max(diffMonths, 1)} mês${diffMonths === 1 ? '' : 'es'}`;
}

function getLastRunTimestamp(lastJobRun: JobRun | null, fallback: number | null) {
  if (!lastJobRun) {
    return fallback;
  }

  return lastJobRun.finishedAt ?? lastJobRun.startedAt;
}

export default function SettingsScreen() {
  const router = useRouter();
  const session = useSession();
  const [confirmDecrease, setConfirmDecrease] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [trendingRegionInput, setTrendingRegionInput] = useState('BR');
  const [maxSubsTrackWidth, setMaxSubsTrackWidth] = useState(0);
  const {
    channels,
    goalMinutes,
    lastIncreasedDate,
    lastSyncLabel,
    noteGoalIncrease,
    setGoalMinutes,
    syncSubscriptions,
  } = useDemoStore();
  const { theme } = useAppTheme();
  const { preference, setPreference } = useThemePreference();
  const resolvedScheme = useResolvedScheme();
  const { data: settingsData } = useLiveQuery(
    db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1),
  );
  const { data: lastJobRunData } = useLiveQuery(
    db.select().from(schema.jobRuns).orderBy(desc(schema.jobRuns.startedAt)).limit(1),
  );

  const today = new Date().toISOString().slice(0, 10);
  const canIncrease = lastIncreasedDate !== today && goalMinutes < 240;
  const canDecrease = goalMinutes > 30;
  const jobSettings = settingsData?.[0] ?? null;
  const lastJobRun = lastJobRunData?.[0] ?? null;
  const lastJobRunTimestamp = getLastRunTimestamp(lastJobRun, jobSettings?.lastJobRunAt ?? null);
  const maxSubsPerJob = jobSettings?.maxSubsPerJob ?? 25;
  const videosPerSub = jobSettings?.videosPerSub ?? 5;
  const includeTrending = jobSettings?.includeTrending ?? false;
  const trendingRegionCode = jobSettings?.trendingRegionCode ?? 'BR';
  const maxSubsRatio =
    (clamp(maxSubsPerJob, MAX_SUBS_MIN, MAX_SUBS_MAX) - MAX_SUBS_MIN) /
    (MAX_SUBS_MAX - MAX_SUBS_MIN);
  const maxSubsKnobLeft = Math.max(
    0,
    Math.min(Math.max(maxSubsTrackWidth - 24, 0), maxSubsRatio * maxSubsTrackWidth - 12),
  );

  useEffect(() => {
    setTrendingRegionInput(trendingRegionCode);
  }, [trendingRegionCode]);

  const handleIncrease = () => {
    if (!canIncrease) return;
    setGoalMinutes(goalMinutes + 30);
    noteGoalIncrease(today);
  };

  const handleDecrease = () => {
    if (!canDecrease) return;
    if (!confirmDecrease) {
      setConfirmDecrease(true);
      return;
    }
    setGoalMinutes(goalMinutes - 30);
    setConfirmDecrease(false);
  };

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
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    Alert.alert(
      'Excluir conta',
      'Todos os seus dados locais serão apagados permanentemente. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setConfirmDelete(false) },
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

  const displayName = session?.name ?? session?.email ?? '—';
  const displayEmail = session?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
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
            <View
              className="items-center justify-center rounded-[24px]"
              style={{ backgroundColor: theme.primary, height: 68, width: 68 }}
            >
              <Text className="text-[24px] font-extrabold text-white">{initial}</Text>
            </View>
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

          {confirmDelete ? (
            <View className="gap-3">
              <PrimaryButton label="Confirmar exclusão" onPress={handleDeleteAccount} />
              <TertiaryButton label="Cancelar" onPress={() => setConfirmDelete(false)} />
            </View>
          ) : (
            <TertiaryButton label="Excluir conta e dados locais" onPress={handleDeleteAccount} />
          )}
        </Panel>
      </View>

      <View className="gap-4">
        <SectionHeading eyebrow="Preferências" title="Aparência" />

        <Panel style={{ gap: 16 }}>
          <View className="gap-3 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
            <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
              Tema
            </Text>
            <SegmentedControl
              onChange={setPreference}
              options={THEME_OPTIONS}
              value={preference}
            />
            <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
              {resolvedScheme === 'dark' ? 'Modo escuro ativo.' : 'Modo claro ativo.'}
            </Text>
          </View>
        </Panel>
      </View>

      <View className="gap-4">
        <SectionHeading eyebrow="Meta diária" title="Quanto você quer assistir" />

        <Panel style={{ gap: 16 }}>
          <View className="gap-4 rounded-[22px] p-4" style={{ backgroundColor: theme.surfaceAlt }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                Meta diária
              </Text>
              <Text className="text-[18px] font-extrabold" style={{ color: theme.primary }}>
                {formatMinutes(goalMinutes)}
              </Text>
            </View>

            {confirmDecrease ? (
              <View className="gap-3">
                <PrimaryButton label="Confirmar -30 min" onPress={handleDecrease} />
                <SecondaryButton label="Cancelar" onPress={() => setConfirmDecrease(false)} />
              </View>
            ) : (
              <View className="flex-row items-center gap-3">
                <Pressable
                  className="items-center justify-center rounded-[18px]"
                  disabled={!canDecrease}
                  onPress={handleDecrease}
                  style={{
                    backgroundColor: theme.surface,
                    height: 48,
                    opacity: canDecrease ? 1 : 0.4,
                    width: 48,
                  }}
                >
                  <Text className="text-[24px] font-bold" style={{ color: theme.text }}>
                    −
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
                      width: `${((goalMinutes - 30) / 210) * 100}%`,
                    }}
                  />
                </View>

                <Pressable
                  className="items-center justify-center rounded-[18px]"
                  disabled={!canIncrease}
                  onPress={handleIncrease}
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
            )}

            <Text className="text-[12px] leading-5" style={{ color: theme.textSoft }}>
              {lastIncreasedDate === today
                ? 'Aumento diário já usado.'
                : 'Máximo de +30 min por dia.'}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <MetricCard
              accent={theme.primary}
              hint="meta de consumo diário"
              label="Meta"
              value={formatMinutes(goalMinutes)}
            />
            <MetricCard
              accent={theme.accent}
              hint="canais ativos no funil"
              label="Curadoria"
              value={`${channels.filter((channel) => channel.active).length}`}
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
          <PrimaryButton label="Sincronizar agora" onPress={syncSubscriptions} />
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
    </AppScrollScreen>
  );
}
