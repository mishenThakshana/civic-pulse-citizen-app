import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { FontFamily } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { LocationProvider } from '@/context/location-context';
import { useTheme } from '@/hooks/use-theme';
import { registerForPushNotifications } from '@/lib/push';

/** Height of the bar itself, before the device's bottom inset is added. */
const TAB_BAR_HEIGHT = 60;

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // The notification and location permission dialogs can't both be shown at
  // once, so location's own request is held back (see `LocationProvider`)
  // until the notification prompt has been answered.
  const [readyForLocationPrompt, setReadyForLocationPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    registerForPushNotifications().finally(() => {
      if (!cancelled) setReadyForLocationPrompt(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)/login" />;

  // Android runs edge-to-edge, so the bar sits under the gesture pill unless we
  // grow it by the bottom inset and pad the items up out of that reserved strip.
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <LocationProvider autoStart={readyForLocationPrompt}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            height: TAB_BAR_HEIGHT + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 8,
          },
          tabBarItemStyle: { paddingVertical: 2 },
          tabBarIconStyle: { marginBottom: 2 },
          tabBarLabelStyle: { fontFamily: FontFamily.medium, fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'document-text' : 'document-text-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="new-report"
          options={{
            title: 'Report',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} color={color} size={size + 4} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </LocationProvider>
  );
}
