import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/shared/ui/buttons';
import { AppScrollScreen, Panel, ScreenHeader } from '@/shared/ui/layout';
import { useAppTheme } from '@/shared/theme/provider';

const MODAL_HIGHLIGHTS: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  title: string;
}[] = [
  {
    icon: 'layers-outline',
    text: 'Superfícies grandes, tipografia forte e muito espaço negativo para o app respirar.',
    title: 'Hierarquia editorial',
  },
  {
    icon: 'color-palette-outline',
    text: 'Paleta puxada do handoff: fundo quente, vermelho controlado e contrastes suaves.',
    title: 'Identidade coerente',
  },
  {
    icon: 'navigate-outline',
    text: 'Barra de abas flutuante e cartões desenhados para validar percepção antes da lógica final.',
    title: 'Navegação com presença',
  },
];

export default function ModalScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <AppScrollScreen>
      <ScreenHeader
        eyebrow="Modal"
        subtitle="Mesmo sendo secundária, a rota agora serve como prova de consistência do novo layout em camadas, cartões e CTAs."
        title="Manifesto visual do play.calmo."
      />

      <View className="gap-4">
        {MODAL_HIGHLIGHTS.map((item) => (
          <Panel key={item.title} style={{ alignItems: 'center', flexDirection: 'row', gap: 16 }}>
            <View
              className="items-center justify-center rounded-[20px]"
              style={{ backgroundColor: theme.primarySoft, height: 52, width: 52 }}
            >
              <Ionicons color={theme.primary} name={item.icon} size={24} />
            </View>
            <View className="flex-1 gap-2">
              <Text className="text-[17px] font-bold" style={{ color: theme.text }}>
                {item.title}
              </Text>
              <Text className="text-[13px] leading-6" style={{ color: theme.textSoft }}>
                {item.text}
              </Text>
            </View>
          </Panel>
        ))}
      </View>

      <Panel style={{ gap: 12 }}>
        <PrimaryButton label="Voltar ao app" onPress={() => router.back()} />
        <SecondaryButton
          label="Abrir configurações"
          onPress={() => router.push('/(app)/(tabs)/settings')}
        />
      </Panel>
    </AppScrollScreen>
  );
}
