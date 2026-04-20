import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { buildAppTheme, type AppTheme } from '@/shared/theme/colors';

export function buildNavigationTheme(theme: AppTheme): Theme {
  const baseTheme = theme.dark ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    dark: theme.dark,
    colors: {
      ...baseTheme.colors,
      background: theme.background,
      border: theme.border,
      card: theme.background,
      notification: theme.primary,
      primary: theme.primary,
      text: theme.text,
    },
  };
}

export const navigationThemes = {
  light: buildNavigationTheme(buildAppTheme(false)),
  dark: buildNavigationTheme(buildAppTheme(true)),
} as const;
