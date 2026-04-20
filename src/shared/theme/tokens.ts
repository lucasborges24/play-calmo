import { buildAppTheme } from './colors';

export type Theme = ReturnType<typeof buildAppTheme> & {
  primaryForeground: string;
  mutedForeground: string;
};

export function getTheme(scheme: 'light' | 'dark'): Theme {
  const base = buildAppTheme(scheme === 'dark');
  return {
    ...base,
    primaryForeground: '#FFFFFF',
    mutedForeground: base.textMuted,
  };
}
