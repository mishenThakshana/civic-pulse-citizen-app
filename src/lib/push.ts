import { PermissionsAndroid, Platform } from 'react-native';

import { registerDevice } from '@/lib/reports';

/**
 * Requests notification permission, reads the device's FCM token, and hands
 * it to the backend so `PushNotificationService` can reach this device.
 *
 * Wrapped end-to-end in a try/catch so a device without Firebase properly
 * linked (e.g. a stale Expo Go / dev client build) degrades to a silent
 * no-op rather than a crash, matching how `PushNotificationService::sendToUser`
 * behaves on the backend when Firebase isn't configured there either.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    // `@react-native-firebase/messaging`'s `requestPermission()` only shows a
    // prompt on iOS (it's deprecated for this exact reason). On Android 13+
    // the OS-level notification toggle is a separate runtime permission that
    // has to be requested explicitly, or the app never asks and every push
    // arrives silently.
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (status !== PermissionsAndroid.RESULTS.GRANTED) return;
    }

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
    // See the doc comment above — Firebase may not be linked on this build.
  }
}
