import { Text, View } from 'react-native';

import { ScreenShell } from '@/shared/components/screen-shell';

export default function SubscriptionsScreen() {
  return (
    <ScreenShell
      eyebrow="Inscrições"
      title="Canais locais"
      description="Aqui entram a sincronização de canais do YouTube e os filtros de curadoria por inscrição."
    >
      <View className="rounded-2xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
        <Text className="text-sm leading-6 text-foreground-light dark:text-foreground-dark">
          O source of truth desta tela será SQLite via Drizzle + useLiveQuery.
        </Text>
      </View>
    </ScreenShell>
  );
}
