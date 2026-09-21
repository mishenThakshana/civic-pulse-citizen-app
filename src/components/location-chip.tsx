import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LocationStatus } from '@/context/location-context';

type LocationChipProps = {
  status: LocationStatus;
  city: string | null;
  onPress?: () => void;
};

export function LocationChip({ status, city, onPress }: LocationChipProps) {
  const theme = useTheme();

  const label =
    status === 'locating'
      ? 'Locating…'
      : status === 'resolved'
        ? (city ?? 'Unknown area')
        : status === 'permission-denied'
          ? 'Location permission needed'
          : status === 'services-disabled'
            ? 'GPS is off — tap to enable'
            : 'Couldn’t locate — tap to retry';

  const isProblem = status === 'permission-denied' || status === 'services-disabled' || status === 'error';
  const iconName = isProblem ? 'location-outline' : 'location-sharp';
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: theme.backgroundSelected, borderColor: isProblem ? theme.warning : theme.border },
      ]}
    >
      <Ionicons name={iconName} size={13} color={isProblem ? theme.warning : theme.accent} />
      <Text style={[styles.text, { color: isProblem ? theme.warning : theme.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: { fontSize: 12, fontFamily: FontFamily.medium },
});
