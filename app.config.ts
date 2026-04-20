import 'dotenv/config';

import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'YT Curator',
  slug: 'ytcurator',
  owner: 'lucasborges24',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/brand/icon-1024.png',
  scheme: 'ytcurator',
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
    permissions: ['INTERNET'],
  },
  web: {
    favicon: './assets/brand/favicon-32.png',
  },
  plugins: ['expo-router', 'expo-secure-store'],
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
