import { Text, View } from 'react-native';

import { ScreenShell } from '@/shared/components/screen-shell';

export default function SettingsScreen() {
  return (
    <ScreenShell
      eyebrow="Configurações"
      title="Preferências locais"
      description="Ajustes de meta diária, limite por job e toggle de trending entram aqui."
    >
      <View className="rounded-2xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
        <Text className="text-sm leading-6 text-foreground-light dark:text-foreground-dark">
          O toggle de trending ficará desligado por padrão.
        </Text>
      </View>
    </ScreenShell>
  );
}
