import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { ScreenShell } from '@/shared/components/screen-shell';
import { info } from '@/shared/lib/logger';

export default function HomeScreen() {
  useEffect(() => {
    info('Today screen mounted');
  }, []);

  return (
    <ScreenShell
      eyebrow="Fase 0"
      title="Bootstrap concluído"
      description="Base Expo SDK 55 pronta para começar autenticação, SQLite local e integrações com a YouTube API."
    >
      <View className="border-primary/20 bg-primary rounded-3xl border p-5">
        <Text className="text-lg font-semibold text-white">App inicial operacional</Text>
        <Text className="mt-2 text-sm leading-6 text-white/80">
          Tabs em pt-BR, alias @/, NativeWind v4 e logger com redação de PII já estão ligados.
        </Text>
      </View>

      <View className="rounded-2xl bg-blue-500 p-4">
        <Text className="text-base font-semibold text-white">OK: NativeWind renderizando</Text>
      </View>

      <View className="rounded-2xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
        <Text className="text-sm font-medium text-foreground-light dark:text-foreground-dark">
          Próximo passo natural: Fase 1 com schema Drizzle, tabelas locais e sessão.
        </Text>
      </View>
    </ScreenShell>
  );
}
