import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import { timeAgo } from '@/lib/format';
import { listNotifications } from '@/lib/reports';
import type { NotificationItem } from '@/types/api';

export default function NotificationsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => listNotifications().then(({ data }) => setItems(data)).catch(() => setItems([])), []);

  useEffect(() => {
    load().finally(() => setLoading(false));
    // Alerts are rendered by the API in the chosen language, so refetch on change.
  }, [load, language]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('alerts.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('alerts.subtitle')}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.report_id && router.push(`/report/${item.report_id}`)}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.accentLight }]}>
              <Ionicons name="notifications-outline" size={16} color={theme.accent} />
            </View>
            <View style={styles.body}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.cardBody, { color: theme.textSecondary }]}>{item.body}</Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{timeAgo(item.created_at, t)}</Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              {t('alerts.empty')}
            </Text>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, marginBottom: Spacing.two },
  title: { fontSize: 20, fontFamily: FontFamily.bold },
  subtitle: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2, lineHeight: 17 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six },
  card: { flexDirection: 'row', gap: Spacing.two, borderWidth: 1, borderRadius: Radius, padding: Spacing.three },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 13, fontFamily: FontFamily.semiBold },
  cardBody: { fontSize: 12, fontFamily: FontFamily.regular, lineHeight: 17 },
  meta: { fontSize: 11, fontFamily: FontFamily.regular, marginTop: 2 },
  empty: { fontSize: 13, fontFamily: FontFamily.regular, textAlign: 'center', marginTop: Spacing.six },
});
