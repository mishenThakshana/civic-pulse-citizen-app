import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportCard } from '@/components/report-card';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { myReports } from '@/lib/reports';
import type { Report, ReportStatus } from '@/types/api';

type Filter = 'all' | ReportStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

export default function ReportsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<Filter>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((withFilter: Filter) => {
    return myReports(withFilter === 'all' ? {} : { status: withFilter })
      .then(({ data }) => setReports(data))
      .catch(() => setReports([]));
  }, []);

  useEffect(() => {
    load(filter).finally(() => setLoading(false));
  }, [filter, load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(filter);
    setRefreshing(false);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Reports</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Everything you have sent and where it stands.</Text>
      </View>

      <View style={styles.tabRow}>
        {FILTERS.map(({ key, label }) => {
          const active = key === filter;
          return (
            <Pressable key={key} onPress={() => setFilter(key)} style={styles.tab}>
              <Text
                style={[
                  styles.tabText,
                  { color: active ? theme.accent : theme.textSecondary, fontFamily: active ? FontFamily.semiBold : FontFamily.medium },
                ]}
              >
                {label}
              </Text>
              {active ? <View style={[styles.tabIndicator, { backgroundColor: theme.accent }]} /> : null}
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
        renderItem={({ item }) => <ReportCard report={item} onPress={() => router.push(`/report/${item.id}`)} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>You haven&apos;t reported anything yet.</Text>
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
  subtitle: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.four, gap: Spacing.four, marginBottom: Spacing.two },
  tab: { paddingBottom: 8 },
  tabText: { fontSize: 13 },
  tabIndicator: { height: 2, borderRadius: 1, marginTop: 6 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six },
  empty: { fontSize: 13, fontFamily: FontFamily.regular, textAlign: 'center', marginTop: Spacing.six },
});
