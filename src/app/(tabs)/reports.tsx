import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportCard } from '@/components/report-card';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import { myReports } from '@/lib/reports';
import type { Report, ReportStatus } from '@/types/api';

type Filter = 'all' | ReportStatus;

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'all', labelKey: 'myReports.all' },
  { key: 'open', labelKey: 'status.open' },
  { key: 'in_progress', labelKey: 'status.in_progress' },
  { key: 'resolved', labelKey: 'status.resolved' },
];

export default function ReportsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();

  const [filter, setFilter] = useState<Filter>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageRef = useRef(1);
  const lastPageRef = useRef(1);

  const loadPage = useCallback((withFilter: Filter, page: number, mode: 'replace' | 'append') => {
    return myReports({ ...(withFilter === 'all' ? {} : { status: withFilter }), page })
      .then(({ data, meta }) => {
        pageRef.current = meta.current_page;
        lastPageRef.current = meta.last_page;
        setReports((prev) => (mode === 'replace' ? data : [...prev, ...data]));
      })
      .catch(() => {
        if (mode === 'replace') setReports([]);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPage(filter, 1, 'replace').finally(() => setLoading(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, loadPage, language])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadPage(filter, 1, 'replace');
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (loadingMore || loading || refreshing) return;
    if (pageRef.current >= lastPageRef.current) return;
    setLoadingMore(true);
    await loadPage(filter, pageRef.current + 1, 'append');
    setLoadingMore(false);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('myReports.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('myReports.subtitle')}</Text>
      </View>

      <View style={styles.tabRow}>
        {FILTERS.map(({ key, labelKey }) => {
          const active = key === filter;
          return (
            <Pressable key={key} onPress={() => setFilter(key)} style={styles.tab}>
              <Text
                style={[
                  styles.tabText,
                  { color: active ? theme.accent : theme.textSecondary, fontFamily: active ? FontFamily.semiBold : FontFamily.medium },
                ]}
              >
                {t(labelKey)}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => <ReportCard report={item} onPress={() => router.push(`/report/${item.id}`)} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.accent} style={styles.footerLoader} /> : null}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>{t('myReports.empty')}</Text>
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
  footerLoader: { marginVertical: Spacing.three },
  empty: { fontSize: 13, fontFamily: FontFamily.regular, textAlign: 'center', marginTop: Spacing.six },
});
