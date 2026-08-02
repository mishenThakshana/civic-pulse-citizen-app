import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { File } from 'expo-file-system';

import type { NicFile } from '@/components/nic-photo-picker';
import { api, ApiError } from '@/lib/api';
import { tokenStorage, userStorage } from '@/lib/storage';
import type { User } from '@/types/api';

type AuthResponse = { user: User; token: string };
type RegisterResponse = { user: User; message: string };

type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  nicNumber: string;
  nicPhotoFront: NicFile;
  nicPhotoBack: NicFile;
  password: string;
  passwordConfirmation: string;
};

/**
 * Expo's fetch (the global `fetch` since SDK 52) builds the multipart body in
 * JS and only understands parts that are a string, a Blob, or an object with a
 * `bytes()` method — React Native's legacy `{ uri, name, type }` shape throws
 * "Unsupported FormDataPart implementation". `expo-file-system`'s `File`
 * satisfies that interface, so we hand the file itself to FormData.
 */
function appendFile(form: FormData, field: string, file: NicFile): void {
  form.append(field, new File(file.uri) as unknown as Blob, file.name);
}

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<string>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const deviceName = `${Constants.deviceName ?? 'Unknown device'} (${Platform.OS})`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // A stored token is only trusted after `/me` confirms the account is still
  // approved and active — otherwise a session left behind by an older build,
  // or an account the admin has since rejected or deactivated, would keep
  // showing the dashboard. Network failures leave the session alone so a
  // temporary outage doesn't sign people out.
  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([tokenStorage.get(), userStorage.get()]);

      if (token && storedUser) {
        try {
          const { user: freshUser } = await api.get<{ user: User }>('/me');
          await userStorage.set(JSON.stringify(freshUser));
          setUser(freshUser);
        } catch (e) {
          if (e instanceof ApiError && e.status === 0) {
            setUser(JSON.parse(storedUser));
          } else {
            await tokenStorage.clear();
            await userStorage.clear();
          }
        }
      }

      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async login(email, password) {
        const response = await api.post<AuthResponse>(
          '/login',
          { email, password, device_name: deviceName },
          false
        );
        await tokenStorage.set(response.token);
        await userStorage.set(JSON.stringify(response.user));
        setUser(response.user);
      },
      // Registering does not sign the citizen in — the account stays pending
      // until an admin approves the NIC, so we only surface the API's message.
      async register(input) {
        const form = new FormData();
        form.append('name', input.name);
        form.append('email', input.email);
        form.append('phone', input.phone);
        form.append('nic_number', input.nicNumber);
        form.append('password', input.password);
        form.append('password_confirmation', input.passwordConfirmation);

        appendFile(form, 'nic_photo_front', input.nicPhotoFront);
        appendFile(form, 'nic_photo_back', input.nicPhotoBack);

        const response = await api.post<RegisterResponse>('/register', form, false);
        return response.message;
      },
      async logout() {
        // No `/logout` endpoint — signing out just forgets the local session.
        await tokenStorage.clear();
        await userStorage.clear();
        setUser(null);
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export { ApiError };
