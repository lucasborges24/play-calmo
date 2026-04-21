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
        sceneStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSoft,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje' }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Inscrições' }} />
      <Tabs.Screen name="library" options={{ title: 'Biblioteca' }} />
      <Tabs.Screen name="settings" options={{ title: 'Configurações' }} />
    </Tabs>
  );
}
