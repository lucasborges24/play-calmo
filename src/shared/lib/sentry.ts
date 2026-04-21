import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version ?? '0.0.0',
    enabled: !__DEV__,
    tracesSampleRate: 0,
  });
}

export function captureException(error: unknown) {
  Sentry.captureException(error);
}

export function setUser(user: { id: string; email?: string } | null) {
  Sentry.setUser(user);
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export const wrap = Sentry.wrap;
