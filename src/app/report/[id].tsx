import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ImageViewerModal } from '@/components/image-viewer-modal';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { StatusBadge } from '@/components/report-card';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import { categoryName } from '@/lib/format';
import { REMOTE_IMAGE_HEADERS } from '@/lib/api';
import { getReport, removeUpvote, upvote } from '@/lib/reports';
import type { Report } from '@/types/api';

function openInMaps(latitude: number, longitude: number) {
  const url = Platform.select({
    ios: `maps:0,0?q=${latitude},${longitude}`,
    default: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
  });
  Linking.openURL(url).catch(() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}`));
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { t, language, dateLocale } = useLanguage();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const load = useCallback(() => {
    return getReport(Number(id))
      .then(({ data }) => setReport(data))
      .catch(() => setReport(null));
    // Reload on a language change so the system notes come back translated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, language]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleVote() {
    if (!report || voting) return;
    setVoting(true);
    try {
      const { votes_count } = report.voted_by_me ? await removeUpvote(report.id) : await upvote(report.id);
      setReport({ ...report, votes_count, voted_by_me: !report.voted_by_me });
    } catch {
      // Leave the vote state as-is on failure.
    } finally {
      setVoting(false);
    }
  }

  if (loading) return <LoadingScreen />;

  if (!report) {
    return (
      <ThemedView style={styles.centered}>
        <Text style={{ color: theme.textSecondary, fontFamily: FontFamily.regular }}>{t('detail.notFound')}</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ headerShown: true, title: t('detail.title', { id: report.id }) }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => setViewerUri(report.photo_url)}>
          <Image source={{ uri: report.photo_url, headers: REMOTE_IMAGE_HEADERS }} style={styles.photo} contentFit="cover" />
        </Pressable>

        <View style={styles.badgeRow}>
          {report.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.categoryText, { color: theme.textSecondary }]}>{categoryName(report.category, t)}</Text>
            </View>
          ) : null}
          <StatusBadge status={report.status} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{report.title}</Text>
        {report.address ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.addressText, { color: theme.textSecondary }]}>{report.address}</Text>
          </View>
        ) : null}
        <Text style={[styles.description, { color: theme.textSecondary }]}>{report.description}</Text>

        <View style={styles.row}>
          <Pressable
            onPress={handleVote}
            disabled={voting}
            style={[
              styles.votePill,
              {
                borderColor: report.voted_by_me ? theme.accent : theme.border,
                backgroundColor: report.voted_by_me ? theme.accentLight : theme.surface,
              },
            ]}
          >
            <Ionicons name="chevron-up" size={16} color={report.voted_by_me ? theme.accent : theme.textSecondary} />
            <Text style={[styles.voteCount, { color: report.voted_by_me ? theme.accent : theme.text }]}>
              {t('detail.affected', { count: report.votes_count })}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => openInMaps(report.latitude, report.longitude)} style={styles.mapLink}>
          <Ionicons name="location-outline" size={16} color={theme.accent} />
          <Text style={[styles.mapLinkText, { color: theme.accent }]}>{t('detail.openMaps')}</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('detail.progress')}</Text>
        <View style={styles.timeline}>
          {report.status_history.map((entry, index) => (
            <View key={entry.id} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: theme.accent }]} />
              {index !== report.status_history.length - 1 ? (
                <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
              ) : null}
              <View style={styles.timelineBody}>
                <View style={styles.badgeRow}>
                  <StatusBadge status={entry.to_status} />
                  {entry.changed_by ? (
                    <Text style={[styles.timelineActor, { color: theme.text }]}>{entry.changed_by}</Text>
                  ) : null}
                </View>
                {entry.note ? <Text style={[styles.timelineNote, { color: theme.textSecondary }]}>{entry.note}</Text> : null}
                {entry.photo_url ? (
                  <Pressable onPress={() => setViewerUri(entry.photo_url)}>
                    <Image source={{ uri: entry.photo_url, headers: REMOTE_IMAGE_HEADERS }} style={styles.timelinePhoto} contentFit="cover" />
                  </Pressable>
                ) : null}
                <Text style={[styles.timelineDate, { color: theme.textSecondary }]}>
                  {new Date(entry.created_at).toLocaleString(dateLocale)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <ImageViewerModal visible={viewerUri !== null} uri={viewerUri} onClose={() => setViewerUri(null)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  content: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  photo: { width: '100%', height: 220, borderRadius: Radius },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: { fontSize: 10, lineHeight: 13, fontFamily: FontFamily.medium, includeFontPadding: false },
  title: { fontSize: 18, fontFamily: FontFamily.bold, marginTop: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 12, fontFamily: FontFamily.regular },
  description: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 20 },
  row: { flexDirection: 'row' },
  votePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  voteCount: { fontSize: 12, fontFamily: FontFamily.semiBold },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  mapLinkText: { fontSize: 13, fontFamily: FontFamily.semiBold },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.semiBold, marginTop: Spacing.three },
  timeline: { marginTop: Spacing.one },
  timelineItem: { flexDirection: 'row', gap: Spacing.two, paddingBottom: Spacing.three },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { position: 'absolute', left: 4.5, top: 14, bottom: -Spacing.three, width: 1 },
  timelineBody: { flex: 1, gap: 4 },
  timelineActor: { fontSize: 12, fontFamily: FontFamily.medium },
  timelineNote: { fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 18 },
  timelinePhoto: { width: 160, height: 100, borderRadius: Radius, marginTop: 4 },
  timelineDate: { fontSize: 11, fontFamily: FontFamily.regular, marginTop: 2 },
});
