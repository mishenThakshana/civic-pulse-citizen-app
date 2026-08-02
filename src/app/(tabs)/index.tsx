import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.six }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.accentLight }]}>
        <Ionicons name="construct-outline" size={28} color={theme.accent} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Welcome, {user?.name}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        You&apos;re signed in. Issue reporting and tracking are coming soon.
      </Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.four },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { fontSize: 18, fontFamily: FontFamily.bold, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 6, textAlign: 'center', lineHeight: 19 },
});
