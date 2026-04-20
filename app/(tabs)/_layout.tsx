import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { semanticColors } from '@/shared/theme/colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = semanticColors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: palette.background,
        },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="today-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inscricoes"
        options={{
          title: 'Inscrições',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="logo-youtube" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="biblioteca"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="library-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="settings-outline" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
