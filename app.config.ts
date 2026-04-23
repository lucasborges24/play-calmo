import 'dotenv/config';

import type { ExpoConfig } from 'expo/config';

// usesCleartextTraffic is a valid Expo Android config but missing from the TS types.
type ExpoPlugin = NonNullable<ExpoConfig['plugins']>[number];

const plugins: ExpoPlugin[] = [];

if (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
  plugins.push([
    '@sentry/react-native/expo',
    {
      organization: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    },
  ]);
}

plugins.push(
  'expo-router',
  'expo-screen-orientation',
  'expo-secure-store',
  'expo-sqlite',
  'expo-background-fetch',
  'expo-task-manager',
  'expo-audio',
  './plugins/with-background-playback',
  [
    'expo-notifications',
    {
      icon: './assets/brand/icon-192.png',
      color: '#E53535',
      androidMode: 'default',
    },
  ],
);

const config: ExpoConfig & { android: { usesCleartextTraffic: boolean } } = {
  name: 'play calmo',
  slug: 'ytcurator',
  owner: 'lucasborges24',
  version: '0.1.0',
  icon: './assets/brand/icon-1024.png',
  scheme: 'playcalmo',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/brand/icon-512.png',
    resizeMode: 'contain',
    backgroundColor: '#F7F7F5',
  },
  assetBundlePatterns: ['**/*'],
  android: {
    package: 'com.synmarket.playcalmo',
    versionCode: 1,
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: './assets/brand/icon-192.png',
      backgroundColor: '#E53535',
    },
    permissions: ['INTERNET', 'RECEIVE_BOOT_COMPLETED', 'POST_NOTIFICATIONS'],
    usesCleartextTraffic: false,
  },
  web: {
    favicon: './assets/brand/favicon-32.png',
  },
  plugins,
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '96fb9fe9-a5bc-4366-ba8f-642351886c98',
    },
  },
};

export default config;
