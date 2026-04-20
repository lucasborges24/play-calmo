import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { semanticColors } from '@/shared/theme/colors';

const lightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: semanticColors.light.background,
    border: semanticColors.light.border,
    card: semanticColors.light.background,
    notification: semanticColors.light.destructive,
    primary: semanticColors.light.primary,
    text: semanticColors.light.foreground,
  },
};

const darkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: semanticColors.dark.background,
    border: semanticColors.dark.border,
    card: semanticColors.dark.background,
    notification: semanticColors.dark.destructive,
    primary: semanticColors.dark.primary,
    text: semanticColors.dark.foreground,
  },
};

export const navigationThemes = {
  light: lightTheme,
  dark: darkTheme,
} as const;
