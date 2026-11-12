import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import type { LocationStatus } from '@/context/location-context';

type LocationChipProps = {
  status: LocationStatus;
  city: string | null;
  onPress?: () => void;
};

export function LocationChip({ status, city, onPress }: LocationChipProps) {
  const theme = useTheme();
  const { t } = useLanguage();

  const label =
    status === 'locating'
      ? t('locationChip.locating')
      : status === 'resolved'
        ? (city ?? t('locationChip.unknownArea'))
        : status === 'permission-denied'
          ? t('locationChip.permission')
          : status === 'services-disabled'
            ? t('locationChip.gpsOff')
            : t('locationChip.error');

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
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: { fontSize: 12, lineHeight: 15, fontFamily: FontFamily.medium, includeFontPadding: false },
});
