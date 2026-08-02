import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type WorkInProgressProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/**
 * Placeholder body for tabs that are navigable but not built yet — the mobile
 * counterpart of the panel's `coming-soon` view.
 */
export function WorkInProgress({ title, description, icon }: WorkInProgressProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.five }]}>
      <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{description}</Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.accentLight }]}>
          <Ionicons name={icon} size={26} color={theme.accent} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Work in progress</Text>
        <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
          {title} will be available in a future update.
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.four },
  pageTitle: { fontSize: 20, fontFamily: FontFamily.bold },
  pageSubtitle: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 4, lineHeight: 19 },
  card: {
    borderWidth: 1,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.four,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  cardTitle: { fontSize: 14, fontFamily: FontFamily.semiBold },
  cardBody: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 19,
  },
});
