import { Redirect, Slot } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db, schema } from '@/db/client';
import { useSessionState } from '@/features/auth/session';
import { useSessionBootstrap } from '@/features/auth/use-session-bootstrap';
import { registerBackgroundFetch } from '@/features/jobs/background';
import { useForegroundCatchUp } from '@/features/jobs/foreground-catchup';
import { setupNotificationChannel } from '@/features/notifications/daily-reminder';
import { syncSubscriptions } from '@/features/subscriptions/sync';
import { error as logError, warn as logWarn } from '@/shared/lib/logger';
import { useAppTheme } from '@/shared/theme/provider';

export default function AppLayout() {
  const { session, isLoaded: isSessionLoaded } = useSessionState();
  const authReady = useSessionBootstrap();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const initialSyncUserRef = useRef<string | null>(null);
  const backgroundFetchRegisteredRef = useRef(false);

  useForegroundCatchUp();
  const { data: settingsData } = useLiveQuery(
    db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1),
  );
  const settings = settingsData?.[0] ?? null;

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (!session) {
      initialSyncUserRef.current = null;
      return;
    }

    if (!settings || settings.lastSubsSyncAt !== null) {
      return;
    }

    if (initialSyncUserRef.current === session.googleUserId) {
      return;
    }

    initialSyncUserRef.current = session.googleUserId;

    let cancelled = false;

    syncSubscriptions()
      .then((result) => {
        if (cancelled) {
          return;
        }

        const totalChanges = result.added + result.updated + result.unsubscribed;
        setToastMessage(totalChanges > 0 ? 'Inscrições sincronizadas.' : 'Inscrições em dia.');
      })
      .catch((syncError: unknown) => {
        logError('Initial subscriptions sync failed', syncError);

        if (cancelled) {
          return;
        }

        setToastMessage('Falha ao sincronizar inscrições.');
      });

    return () => {
      cancelled = true;
    };
  }, [session, settings]);

  useEffect(() => {
    if (!session || backgroundFetchRegisteredRef.current) {
      return;
    }

    backgroundFetchRegisteredRef.current = true;

    setupNotificationChannel().catch((err: unknown) => {
      logWarn('Failed to setup notification channel', { err });
    });

    registerBackgroundFetch().catch((err: unknown) => {
      logWarn('Failed to register background fetch', { err });
    });
  }, [session]);

  if (!ready || !authReady || !isSessionLoaded) return <View style={{ flex: 1 }} />;
  if (!session) return <Redirect href="/sign-in" />;

  return (
    <View style={{ flex: 1 }}>
      <Slot />

      {toastMessage ? (
        <View
          pointerEvents="none"
          style={{
            bottom: insets.bottom + 92,
            left: 20,
            position: 'absolute',
            right: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: 999,
              borderWidth: 1,
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: theme.dark ? 0.28 : 1,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <Text className="text-center text-[13px] font-semibold" style={{ color: theme.text }}>
              {toastMessage}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
