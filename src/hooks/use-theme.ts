import { Colors } from '@/constants/theme';

/**
 * CivicPulse is light-themed only — the phone's dark mode setting is
 * intentionally ignored so the app always renders in its brand palette.
 */
export function useTheme() {
  return Colors.light;
}
