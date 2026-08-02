import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'civicpulse_token';
const USER_KEY = 'civicpulse_user';

/**
 * SecureStore isn't available on web, so we fall back to localStorage there.
 */
function createStringStorage(key: string) {
  return {
    async get(): Promise<string | null> {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return SecureStore.getItemAsync(key);
    },

    async set(value: string): Promise<void> {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    },

    async clear(): Promise<void> {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    },
  };
}

export const tokenStorage = createStringStorage(TOKEN_KEY);
export const userStorage = createStringStorage(USER_KEY);
