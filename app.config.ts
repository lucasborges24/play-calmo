import 'dotenv/config';

import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'YT Curator',
  slug: 'ytcurator',
  owner: 'lucasborges24',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'ytcurator',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  assetBundlePatterns: ['**/*'],
  android: {
    package: 'com.synmarket.playcalmo',
    versionCode: 1,
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    permissions: ['INTERNET'],
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
