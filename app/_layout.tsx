import '../global.css';

import { ThemeProvider } from '@react-navigation/native';
import {
  DMSans_400Regular,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MigrationsGate } from '@/db/MigrationsGate';
import { DemoStoreProvider } from '@/shared/state/demo-store';
import { buildNavigationTheme } from '@/shared/theme/navigation';
import { AppThemeProvider, useAppTheme } from '@/shared/theme/provider';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <ThemeProvider value={buildNavigationTheme(theme)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
      </Stack>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    DMSans_400Regular,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });

  if (fontsError) {
    throw fontsError;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <DemoStoreProvider>
          <MigrationsGate>
            <RootNavigator />
          </MigrationsGate>
        </DemoStoreProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
