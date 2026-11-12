import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { FontFamily } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { LocationProvider } from '@/context/location-context';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import { registerForPushNotifications } from '@/lib/push';

/** Height of the bar itself, before the device's bottom inset is added. */
const TAB_BAR_HEIGHT = 68;

/**
 * Tab label that never clips: Sinhala and Tamil glyphs sit taller than Latin
 * ones and some labels are long, so the line height is generous and the text
 * shrinks to fit the tab's width instead of being cut off.
 */
function TabLabel({ color, children }: { color: ColorValue; children: string }) {
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      style={{ color, fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 2 }}
    >
      {children}
    </Text>
  );
}

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

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
          tabBarLabel: ({ color, children }) => <TabLabel color={color}>{children}</TabLabel>,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: t('tabs.reports'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'document-text' : 'document-text-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="new-report"
          options={{
            title: t('tabs.report'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} color={color} size={size + 4} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t('tabs.alerts'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </LocationProvider>
  );
}
