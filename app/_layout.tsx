import '../global.css';

import {
  DMSans_400Regular,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useRouter, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MigrationsGate } from '@/db/MigrationsGate';
import { runFetchVideosJob } from '@/features/jobs/fetch-videos-job';
import { initSentry, wrap as sentryWrap } from '@/shared/lib/sentry';
import { loadThemePreference } from '@/shared/hooks/useThemePreference';
import { AppThemeProvider, useAppTheme } from '@/shared/theme/provider';
import { buildNavigationTheme } from '@/shared/theme/navigation';
import { ThemeProvider } from '@react-navigation/native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();
initSentry();

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
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { action?: string };
      if (data?.action === 'run-job') {
        router.navigate('/');
        void runFetchVideosJob('manual');
      }
    });

    return () => subscription.remove();
  }, [router]);

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

function RootLayout() {
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

export default sentryWrap(RootLayout);
