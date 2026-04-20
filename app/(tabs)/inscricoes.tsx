import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useDemoStore } from '@/shared/state/demo-store';
import { useAppTheme } from '@/shared/theme/provider';
import { ChannelCard } from '@/shared/ui/channel-card';
import { EmptyState } from '@/shared/ui/empty-state';
import {
  AppScrollScreen,
  MetricCard,
  Panel,
  ScreenHeader,
  SectionHeading,
  Tag,
} from '@/shared/ui/layout';

export default function SubscriptionsScreen() {
  const { channels, lastSyncLabel, syncSubscriptions, toggleChannel } = useDemoStore();
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const activeChannels = filteredChannels.filter((channel) => channel.active);
  const waitingChannels = filteredChannels.filter((channel) => !channel.active);

  return (
    <AppScrollScreen>
      <ScreenHeader
        eyebrow="Inscrições"
        subtitle="Os canais agora aparecem como peças do sistema visual, com status mais claro e muito menos sensação de tabela crua."
        title="Deixe só o que merece entrar no dia."
        trailing={
          <Pressable
            className="items-center justify-center rounded-[20px]"
            onPress={syncSubscriptions}
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              height: 48,
              width: 48,
            }}
          >
            <Ionicons color={theme.text} name="sync-outline" size={22} />
          </Pressable>
        }
      />

      <Panel style={{ gap: 16 }}>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text className="text-[18px] font-bold" style={{ color: theme.text }}>
              Sincronização manual, com peso visual certo
            </Text>
            <Text className="text-[14px] leading-6" style={{ color: theme.textSoft }}>
              O layout usa destaque só onde importa: status, volume de canais e últimos toques na curadoria.
            </Text>
          </View>
          <Tag label={lastSyncLabel} tone="accent" />
        </View>

        <View className="flex-row gap-3">
          <MetricCard
            accent={theme.primary}
            hint="canais participando da curadoria"
            label="Ativos"
            value={`${channels.filter((channel) => channel.active).length}`}
          />
          <MetricCard
            accent={theme.accent}
            hint="canais pausados sem sair da biblioteca"
            label="Em espera"
            value={`${channels.filter((channel) => !channel.active).length}`}
          />
        </View>
      </Panel>

      <Panel style={{ padding: 12 }}>
        <View
          className="flex-row items-center gap-3 rounded-[20px] px-4 py-3"
          style={{ backgroundColor: theme.surfaceAlt }}
        >
          <Ionicons color={theme.textMuted} name="search" size={18} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Buscar canal"
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            style={{ color: theme.text, flex: 1, fontSize: 15 }}
            value={query}
          />
        </View>
      </Panel>

      {filteredChannels.length === 0 ? (
        <EmptyState
          description="Mude a busca ou restaure um canal para preencher esta área novamente."
          icon="logo-youtube"
          title="Nenhum canal encontrado"
        />
      ) : (
        <View className="gap-6">
          {activeChannels.length > 0 ? (
            <View className="gap-4">
              <SectionHeading
                detail={`${activeChannels.length} ativos`}
                eyebrow="Na fila"
                title="Canais priorizados"
              />
              <View className="gap-4">
                {activeChannels.map((channel) => (
                  <ChannelCard key={channel.id} channel={channel} onToggle={toggleChannel} />
                ))}
              </View>
            </View>
          ) : null}

          {waitingChannels.length > 0 ? (
            <View className="gap-4">
              <SectionHeading
                detail={`${waitingChannels.length} pausados`}
                eyebrow="Em espera"
                title="Ainda bonitos, mas fora da fila"
              />
              <View className="gap-4">
                {waitingChannels.map((channel) => (
                  <ChannelCard key={channel.id} channel={channel} onToggle={toggleChannel} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      )}
    </AppScrollScreen>
  );
}
