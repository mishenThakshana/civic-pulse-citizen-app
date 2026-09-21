import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationChip } from '@/components/location-chip';
import { ReportCard } from '@/components/report-card';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCurrentLocation } from '@/context/location-context';
import { useTheme } from '@/hooks/use-theme';
import { listReports, removeUpvote, upvote } from '@/lib/reports';
import type { Report } from '@/types/api';

type Sort = 'newest' | 'most_voted';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const location = useCurrentLocation();

  const [sort, setSort] = useState<Sort>('newest');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);

  const load = useCallback((withSort: Sort) => {
    return listReports({ sort: withSort })
      .then(({ data }) => setReports(data))
      .catch(() => setReports([]));
  }, []);

  useEffect(() => {
    load(sort).finally(() => setLoading(false));
  }, [sort, load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(sort);
    setRefreshing(false);
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
          <Text style={[styles.title, { color: theme.text }]}>Issues near you</Text>
          <LocationChip status={location.status} city={location.city} onPress={location.refresh} />
        </View>
        {user ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Signed in as {user.name}</Text> : null}
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
                {option === 'newest' ? 'Newest' : 'Most voted'}
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
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => router.push(`/report/${item.id}`)}
            onVote={() => handleVote(item)}
            votePending={votingId === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              No reports yet. Be the first to report an issue nearby.
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
  empty: { fontSize: 13, fontFamily: FontFamily.regular, textAlign: 'center', marginTop: Spacing.six },
});
