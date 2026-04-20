import { Text, View } from 'react-native';

import { ScreenShell } from '@/shared/components/screen-shell';

export default function LibraryScreen() {
  return (
    <ScreenShell
      eyebrow="Biblioteca"
      title="Histórico e reversão"
      description="A biblioteca vai concentrar vídeos vistos, excluídos e ações desfazíveis do plano diário."
    >
      <View className="rounded-2xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
        <Text className="text-sm leading-6 text-foreground-light dark:text-foreground-dark">
          A ação de marcar visto poderá ser desfeita aqui, conforme a decisão fixa do projeto.
        </Text>
      </View>
    </ScreenShell>
  );
}
