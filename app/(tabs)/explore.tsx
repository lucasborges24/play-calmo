import { Text, View } from 'react-native';

import { ScreenShell } from '@/shared/components/screen-shell';

export default function ExploreScreen() {
  return (
    <ScreenShell
      eyebrow="Rota reserva"
      title="Tela não utilizada"
      description="Esta rota ficou de fora das tabs principais e pode ser removida ou reaproveitada depois."
    >
      <View className="rounded-2xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
        <Text className="text-sm leading-6 text-foreground-light dark:text-foreground-dark">
          Mantida apenas para evitar ruído durante o bootstrap inicial.
        </Text>
      </View>
    </ScreenShell>
  );
}
