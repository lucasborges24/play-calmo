import * as SecureStore from 'expo-secure-store';

const KEY = 'google_refresh_token';
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, token, OPTIONS);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY, OPTIONS);
}

export async function deleteRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY, OPTIONS);
}
