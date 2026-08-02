import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) return <LoadingScreen />;
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerTitle: '',
        headerTintColor: theme.accent,
      }}
    >
      <Stack.Screen name="login" options={{ headerBackVisible: false }} />
      <Stack.Screen name="register" />
      <Stack.Screen name="pending" options={{ headerBackVisible: false, gestureEnabled: false }} />
    </Stack>
  );
}
