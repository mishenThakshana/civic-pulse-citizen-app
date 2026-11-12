import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationChip } from '@/components/location-chip';
import { ReportCard } from '@/components/report-card';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCurrentLocation } from '@/context/location-context';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import { listReports, removeUpvote, upvote } from '@/lib/reports';
import type { Report } from '@/types/api';

type Sort = 'newest' | 'most_voted';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const location = useCurrentLocation();
  const { t, language } = useLanguage();

  const [sort, setSort] = useState<Sort>('newest');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);

  const pageRef = useRef(1);
  const lastPageRef = useRef(1);

  const loadPage = useCallback((withSort: Sort, page: number, mode: 'replace' | 'append') => {
    return listReports({ sort: withSort, page })
      .then(({ data, meta }) => {
        pageRef.current = meta.current_page;
        lastPageRef.current = meta.last_page;
        setReports((prev) => (mode === 'replace' ? data : [...prev, ...data]));
      })
      .catch(() => {
        if (mode === 'replace') setReports([]);
      });
  }, []);

  // Refetches every time the Home tab comes into focus — including right after
  // posting a report, since new-report.tsx redirects back here.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPage(sort, 1, 'replace').finally(() => setLoading(false));
      // Reload when the language changes so system notes come back translated.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sort, loadPage, language])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadPage(sort, 1, 'replace');
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (loadingMore || loading || refreshing) return;
    if (pageRef.current >= lastPageRef.current) return;
    setLoadingMore(true);
    await loadPage(sort, pageRef.current + 1, 'append');
    setLoadingMore(false);
  }

  async function handleVote(report: Report) {
    if (votingId !== null) return;
    setVotingId(report.id);
    try {
      const { votes_count } = report.voted_by_me ? await removeUpvote(report.id) : await upvote(report.id);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, votes_count, voted_by_me: !report.voted_by_me } : r))
      );
    } catch {
      // Leave the list as-is — the citizen can just try again.
    } finally {
      setVotingId(null);
    }
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>{t('home.title')}</Text>
          <LocationChip status={location.status} city={location.city} onPress={location.refresh} />
        </View>
        {user ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('home.signedInAs', { name: user.name })}</Text> : null}
      </View>

      <View style={styles.tabRow}>
        {(['newest', 'most_voted'] as Sort[]).map((option) => {
          const active = option === sort;
          return (
            <Pressable key={option} onPress={() => setSort(option)} style={styles.tab}>
              <Text
                style={[
                  styles.tabText,
                  { color: active ? theme.accent : theme.textSecondary, fontFamily: active ? FontFamily.semiBold : FontFamily.medium },
                ]}
              >
                {option === 'newest' ? t('home.newest') : t('home.mostVoted')}
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
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => router.push(`/report/${item.id}`)}
            onVote={() => handleVote(item)}
            votePending={votingId === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.accent} style={styles.footerLoader} /> : null}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              {t('home.empty')}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
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
