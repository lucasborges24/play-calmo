import { createContext, useContext, type PropsWithChildren } from 'react';

import { buildAppTheme, type AppTheme } from '@/shared/theme/colors';
import { useResolvedScheme } from '@/shared/hooks/useThemePreference';

type AppThemeContextValue = {
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  theme: AppTheme;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const scheme = useResolvedScheme();
  const isDark = scheme === 'dark';
  const theme = buildAppTheme(isDark);

  return (
    <AppThemeContext.Provider
      value={{
        isDark,
        setIsDark: () => {},
        theme,
      }}
    >
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}
