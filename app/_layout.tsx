import '@/../global.css';

import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';

import { navigationThemes } from '@/shared/theme/navigation';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? navigationThemes.dark : navigationThemes.light}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
