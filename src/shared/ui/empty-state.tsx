import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PrimaryButton } from '@/shared/ui/buttons';
import { Panel } from '@/shared/ui/layout';
import { useAppTheme } from '@/shared/theme/provider';

type EmptyStateProps = {
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function EmptyState({ description, icon, title, ctaLabel, onCta }: EmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <Panel style={{ alignItems: 'center', gap: 16, paddingVertical: 28 }}>
      <View
        className="items-center justify-center rounded-[22px]"
        style={{
          backgroundColor: theme.primarySoft,
          height: 72,
          width: 72,
        }}
      >
        <Ionicons color={theme.primary} name={icon} size={30} />
      </View>

      <View className="items-center gap-2">
        <Text className="text-center text-[20px] font-extrabold" style={{ color: theme.text }}>
          {title}
        </Text>
        <Text className="text-center text-[14px] leading-6" style={{ color: theme.textSoft }}>
          {description}
        </Text>
      </View>

      {ctaLabel && onCta ? <PrimaryButton label={ctaLabel} onPress={onCta} /> : null}
    </Panel>
  );
}
