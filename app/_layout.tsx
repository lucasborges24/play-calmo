import '../global.css';

import {
  DMSans_400Regular,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MigrationsGate } from '@/db/MigrationsGate';
import { loadThemePreference } from '@/shared/hooks/useThemePreference';
import { AppThemeProvider, useAppTheme } from '@/shared/theme/provider';
import { buildNavigationTheme } from '@/shared/theme/navigation';
import { ThemeProvider } from '@react-navigation/native';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
    },
  },
});

function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <ThemeProvider value={buildNavigationTheme(theme)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="sign-in" />
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

  useEffect(() => {
    loadThemePreference();
  }, []);

  if (fontsError) {
    throw fontsError;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <MigrationsGate>
            <AppThemeProvider>
              <RootNavigator />
            </AppThemeProvider>
          </MigrationsGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
