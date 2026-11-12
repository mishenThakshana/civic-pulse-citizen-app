import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.five }]}>
      <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
        <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
      </View>

      <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
      <View style={[styles.statusBadge, { backgroundColor: theme.accentLight }]}>
        <Text style={[styles.statusText, { color: theme.accent }]}>
          {user?.approval_status === 'approved' ? t('profile.verified') : user?.approval_status}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.rowText, { color: theme.text }]}>{user?.email}</Text>
        </View>
        {user?.phone ? (
          <View style={styles.row}>
            <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.rowText, { color: theme.text }]}>{user.phone}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.language}>
        <LanguageSwitcher showLabel />
      </View>

      <Button title={t('profile.signOut')} variant="ghost" onPress={logout} style={styles.signOut} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.four },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontFamily: FontFamily.bold, color: '#fff' },
  name: { fontSize: 18, fontFamily: FontFamily.bold, marginTop: Spacing.two },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6, marginBottom: Spacing.five },
  statusText: { fontSize: 11, fontFamily: FontFamily.bold, textTransform: 'capitalize' },
  card: { width: '100%', borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 14, fontFamily: FontFamily.regular },
  language: { marginTop: Spacing.four },
  signOut: { width: '100%', marginTop: Spacing.four },
});
