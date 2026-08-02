import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FALLBACK_MESSAGE =
  'Your account has been submitted for review. You will be able to sign in once an administrator approves your NIC.';

/**
 * Shown straight after a successful registration. The citizen has no session
 * yet — an admin has to approve the NIC before signing in is possible.
 */
export default function PendingApprovalScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { message } = useLocalSearchParams<{ message?: string }>();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.six }]}
    >
      <View style={[styles.badge, { backgroundColor: theme.accentLight }]}>
        <Ionicons name="time-outline" size={34} color={theme.accent} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Pending approval</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{message || FALLBACK_MESSAGE}</Text>

      <View style={[styles.note, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="information-circle-outline" size={18} color={theme.accent} />
        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
          Reviews are done manually, so this can take a little while. Try signing in again later — if
          your registration is turned down, the reason is shown on the sign-in screen.
        </Text>
      </View>

      <Button title="Back to sign in" onPress={() => router.replace('/(auth)/login')} style={styles.action} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    alignItems: 'center',
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { fontSize: 22, fontFamily: FontFamily.bold, textAlign: 'center' },
  body: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 340,
  },
  note: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    padding: 12,
    marginTop: Spacing.four,
    maxWidth: 360,
  },
  noteText: { flex: 1, fontSize: 12, fontFamily: FontFamily.regular, lineHeight: 18 },
  action: { alignSelf: 'stretch', maxWidth: 360, width: '100%', marginTop: Spacing.five },
});
