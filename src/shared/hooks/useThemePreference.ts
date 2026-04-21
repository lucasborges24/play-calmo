import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';

type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme-pref';

interface ThemePreferenceStore {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

export const useThemePreference = create<ThemePreferenceStore>((set) => ({
  preference: 'system',
  setPreference: (pref) => {
    set({ preference: pref });
    AsyncStorage.setItem(STORAGE_KEY, pref);
  },
}));

export async function loadThemePreference() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    useThemePreference.setState({ preference: stored });
  }
}

export function useResolvedScheme(): 'light' | 'dark' {
  const preference = useThemePreference((s) => s.preference);
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  if (preference === 'system') return system;
  return preference;
}
