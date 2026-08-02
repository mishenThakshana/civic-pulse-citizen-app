import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuth } from '@/context/auth-context';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return <Redirect href={user ? '/(tabs)' : '/(auth)/login'} />;
}
