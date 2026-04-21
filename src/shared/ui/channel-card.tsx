import { Switch, Text, View } from 'react-native';

import type { AppChannel } from '@/shared/state/demo-store';
import { Panel, Tag } from '@/shared/ui/layout';
import { useAppTheme } from '@/shared/theme/provider';

type ChannelCardProps = {
  channel: AppChannel;
  onToggle: (id: string, active: boolean) => void;
};

export function ChannelCard({ channel, onToggle }: ChannelCardProps) {
  const { theme } = useAppTheme();

  return (
    <Panel style={{ padding: 16 }}>
      <View className="flex-row items-start gap-4">
        <View
          className="items-center justify-center rounded-[18px]"
          style={{
            backgroundColor: channel.accent,
            height: 56,
            width: 56,
          }}
        >
          <Text className="text-[22px] font-extrabold text-white">
            {channel.name.charAt(0)}
          </Text>
        </View>

        <View className="flex-1 gap-3">
          <View className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-[17px] font-bold" style={{ color: theme.text }}>
                {channel.name}
              </Text>
              <Tag
                active={channel.active}
                label={channel.active ? 'Ativo' : 'Em espera'}
                tone={channel.active ? 'primary' : 'neutral'}
              />
            </View>

            <Text className="text-[13px]" style={{ color: theme.textSoft }}>
              {channel.subscriberCount} inscritos · {channel.cadence}
            </Text>
          </View>

          <Text className="text-[13px] leading-6" style={{ color: theme.textSoft }}>
            {channel.note}
          </Text>
        </View>
      </View>

      <View
        className="mt-4 flex-row items-center justify-between rounded-[20px] px-4 py-3"
        style={{ backgroundColor: theme.surfaceAlt }}
      >
        <View className="flex-1 pr-4">
          <Text className="text-[13px] font-semibold" style={{ color: theme.text }}>
            Entrar na curadoria diária
          </Text>
          <Text className="mt-1 text-[12px] leading-5" style={{ color: theme.textSoft }}>
            O layout prioriza clareza: menos canais ativos deixam a fila mais respirável.
          </Text>
        </View>

        <Switch
          ios_backgroundColor={theme.border}
          onValueChange={(value) => onToggle(channel.id, value)}
          thumbColor="#FFFFFF"
          trackColor={{ false: theme.border, true: theme.primary }}
          value={channel.active}
        />
      </View>
    </Panel>
  );
}
