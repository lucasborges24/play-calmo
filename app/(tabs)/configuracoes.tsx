import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { formatMinutes } from '@/shared/lib/formatters';
import { useDemoStore } from '@/shared/state/demo-store';
import { useAppTheme } from '@/shared/theme/provider';
import { PrimaryButton, SecondaryButton } from '@/shared/ui/buttons';
import {
  AppScrollScreen,
  MetricCard,
  Panel,
  ScreenHeader,
  SectionHeading,
  Tag,
} from '@/shared/ui/layout';

export default function SettingsScreen() {
  const [confirmDecrease, setConfirmDecrease] = useState(false);
  const {
    channels,
    goalMinutes,
    lastIncreasedDate,
    lastSyncLabel,
    noteGoalIncrease,
    setGoalMinutes,
    syncSubscriptions,
    user,
  } = useDemoStore();
  const { isDark, setIsDark, theme } = useAppTheme();

  const today = new Date().toISOString().slice(0, 10);
  const canIncrease = lastIncreasedDate !== today && goalMinutes < 240;
  const canDecrease = goalMinutes > 30;

  const handleIncrease = () => {
    if (!canIncrease) {
      return;
    }

    setGoalMinutes(goalMinutes + 30);
    noteGoalIncrease(today);
  };

  const handleDecrease = () => {
    if (!canDecrease) {
      return;
    }

    if (!confirmDecrease) {
      setConfirmDecrease(true);
      return;
    }

    setGoalMinutes(goalMinutes - 30);
    setConfirmDecrease(false);
  };

  return (
    <AppScrollScreen>
      <ScreenHeader
        eyebrow="Configurações"
        subtitle="Até a tela utilitária ganhou o mesmo cuidado editorial: informação clara, blocos generosos e menos cara de painel técnico."
        title="Ajustes suaves, sem painel frio."
        trailing={
          <View
            className="items-center justify-center rounded-[20px] px-4 py-3"
            style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }}
          >
            <Ionicons color={theme.text} name={isDark ? 'moon' : 'sunny'} size={22} />
          </View>
        }
      />

      <Panel style={{ gap: 16 }}>
        <View className="flex-row items-center gap-4">
          <View
            className="items-center justify-center rounded-[24px]"
            style={{ backgroundColor: theme.primary, height: 68, width: 68 }}
          >
            <Text className="text-[24px] font-extrabold text-white">
              {user.displayName.charAt(0)}
            </Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-[20px] font-extrabold" style={{ color: theme.text }}>
              {user.displayName}
            </Text>
            <Text className="text-[14px]" style={{ color: theme.textSoft }}>
              {user.email}
            </Text>
          </View>
          <Tag label="Perfil local" tone="accent" />
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

      <View className="gap-4">
        <SectionHeading eyebrow="Preferências" title="Aparência e ritmo" />

        <Panel style={{ gap: 16 }}>
          <View
            className="flex-row items-center justify-between rounded-[22px] p-4"
            style={{ backgroundColor: theme.surfaceAlt }}
          >
            <View className="flex-1 pr-4">
              <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                Modo escuro
              </Text>
              <Text className="mt-2 text-[13px] leading-6" style={{ color: theme.textSoft }}>
                O toggle é imediato para validar o layout em dois ambientes sem mexer na lógica do produto.
              </Text>
            </View>
            <Switch
              ios_backgroundColor={theme.border}
              onValueChange={setIsDark}
              thumbColor="#FFFFFF"
              trackColor={{ false: theme.border, true: theme.primary }}
              value={isDark}
            />
          </View>

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
                <SecondaryButton
                  label="Cancelar"
                  onPress={() => setConfirmDecrease(false)}
                />
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
                ? 'Aumento diário já usado. O controle foi mantido visualmente claro para reforçar essa regra.'
                : 'A leitura segue o README do handoff: aumento máximo de 30 minutos por dia.'}
            </Text>
          </View>
        </Panel>
      </View>

      <View className="gap-4">
        <SectionHeading eyebrow="Sincronização" title="Operações com menos fricção visual" />

        <Panel style={{ gap: 14 }}>
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1 gap-2">
              <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                Última sync
              </Text>
              <Text className="text-[14px] leading-6" style={{ color: theme.textSoft }}>
                {lastSyncLabel}. O botão ganhou destaque suficiente para testes visuais sem poluir a tela.
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
