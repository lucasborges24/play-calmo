import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

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

export default function SettingsScreen() {
  const router = useRouter();
  const session = useSession();
  const [confirmDecrease, setConfirmDecrease] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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

  const today = new Date().toISOString().slice(0, 10);
  const canIncrease = lastIncreasedDate !== today && goalMinutes < 240;
  const canDecrease = goalMinutes > 30;

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
    </AppScrollScreen>
  );
}
