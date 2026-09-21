import { Platform } from 'react-native';

import { registerDevice } from '@/lib/reports';

/**
 * Requests notification permission, reads the device's FCM token, and hands
 * it to the backend so `PushNotificationService` can reach this device.
 *
 * Wrapped end-to-end in a try/catch: until a real `google-services.json` /
 * `GoogleService-Info.plist` is dropped in and the app is rebuilt with
 * `npx expo prebuild --clean`, the native Firebase module isn't configured
 * and calling into it would throw. This makes that a silent no-op rather
 * than a crash, matching how `PushNotificationService::sendToUser` behaves
 * on the backend when Firebase isn't configured there either.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    const {
      getMessaging,
      requestPermission,
      getToken,
      onTokenRefresh,
      registerDeviceForRemoteMessages,
      AuthorizationStatus,
    } = await import('@react-native-firebase/messaging');

    const messaging = getMessaging();

    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messaging);
    }

    const authStatus = await requestPermission(messaging);
    const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
    if (!enabled) return;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    const token = await getToken(messaging);
    if (token) await registerDevice(token, platform);

    onTokenRefresh(messaging, (newToken: string) => {
      registerDevice(newToken, platform).catch(() => {});
    });
  } catch {
    // Firebase isn't configured yet — see the doc comment above.
  }
}
