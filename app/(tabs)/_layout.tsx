import { Tabs } from 'expo-router';

import { useAppTheme } from '@/shared/theme/provider';
import { FloatingTabBar } from '@/shared/ui/floating-tab-bar';

export default function TabLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
        }}
      />
      <Tabs.Screen
        name="inscricoes"
        options={{
          title: 'Inscrições',
        }}
      />
      <Tabs.Screen
        name="biblioteca"
        options={{
          title: 'Biblioteca',
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: 'Explorar',
        }}
      />
    </Tabs>
  );
}
