import * as SplashScreen from 'expo-splash-screen';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { db } from './client';
import { migrations } from './migrations';
import { seedIfNeeded } from './seed';

import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

type MigrationsGateProps = {
  children: ReactNode;
};

export function MigrationsGate({ children }: MigrationsGateProps) {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <MigrationsRuntime key={retryKey} onRetry={() => setRetryKey((current) => current + 1)}>
      {children}
    </MigrationsRuntime>
  );
}

function MigrationsRuntime({
  children,
  onRetry,
}: MigrationsGateProps & {
  onRetry: () => void;
}) {
  const { error: migrationError, success } = useMigrations(db, migrations);
  const [seedState, setSeedState] = useState<'idle' | 'running' | 'done'>('idle');
  const [seedError, setSeedError] = useState<Error>();

  useEffect(() => {
    if (!success || seedState !== 'idle') {
      return;
    }

    setSeedState('running');

    seedIfNeeded()
      .then(() => {
        setSeedState('done');
      })
      .catch((error: unknown) => {
        setSeedError(error instanceof Error ? error : new Error('Falha ao executar seed inicial.'));
      });
  }, [seedState, success]);

  const error = migrationError ?? seedError;
  const ready = success && seedState === 'done';

  useEffect(() => {
    if (!ready && !error) {
      return;
    }

    SplashScreen.hideAsync().catch(() => undefined);
  }, [error, ready]);

  if (error) {
    return <MigrationErrorScreen error={error} onRetry={onRetry} />;
  }

  if (!ready) {
    return <MigrationLoadingScreen />;
  }

  return <>{children}</>;
}

function MigrationLoadingScreen() {
  return <View style={styles.loadingScreen} />;
}

function MigrationErrorScreen({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorScreen}>
      <Text style={styles.errorTitle}>Falha ao abrir o banco local</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Pressable onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    backgroundColor: '#111111',
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  errorMessage: {
    color: '#d4d4d8',
    fontSize: 15,
    lineHeight: 22,
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  retryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
});
