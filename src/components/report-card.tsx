import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { REMOTE_IMAGE_HEADERS } from '@/lib/api';
import type { Report, ReportStatus } from '@/types/api';

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusLabel(status: ReportStatus): string {
  return status === 'in_progress' ? 'In Progress' : status === 'resolved' ? 'Resolved' : 'Open';
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  const theme = useTheme();
  const color = status === 'resolved' ? theme.success : status === 'in_progress' ? theme.accent : theme.warning;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

type ReportCardProps = {
  report: Report;
  onPress: () => void;
  onVote?: () => void;
  votePending?: boolean;
};

export function ReportCard({ report, onPress, onVote, votePending }: ReportCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Image source={{ uri: report.photo_url, headers: REMOTE_IMAGE_HEADERS }} style={styles.thumbnail} contentFit="cover" />

      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {report.title}
        </Text>
        <View style={styles.badgeRow}>
          {report.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.categoryText, { color: theme.textSecondary }]}>{report.category.name}</Text>
            </View>
          ) : null}
          <StatusBadge status={report.status} />
        </View>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>{timeAgo(report.created_at)}</Text>
      </View>

      {onVote ? (
        <Pressable
          onPress={onVote}
          disabled={votePending}
          style={[
            styles.votePill,
            {
              borderColor: report.voted_by_me ? theme.accent : theme.border,
              backgroundColor: report.voted_by_me ? theme.accentLight : theme.background,
            },
          ]}
        >
          <Ionicons name="chevron-up" size={16} color={report.voted_by_me ? theme.accent : theme.textSecondary} />
          <Text style={[styles.voteCount, { color: report.voted_by_me ? theme.accent : theme.text }]}>
            {report.votes_count}
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius,
    padding: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
  thumbnail: { width: 64, height: 64, borderRadius: Radius },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontFamily: FontFamily.semiBold, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  categoryBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  categoryText: { fontSize: 10, fontFamily: FontFamily.medium },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: FontFamily.medium },
  meta: { fontSize: 11, fontFamily: FontFamily.regular },
  votePill: {
    borderWidth: 1,
    borderRadius: Radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 48,
  },
  voteCount: { fontSize: 13, fontFamily: FontFamily.semiBold, marginTop: 2 },
});
