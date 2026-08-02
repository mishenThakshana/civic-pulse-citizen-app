/**
 * CivicPulse theme — mirrors the admin web panel's orange palette.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111111',
    textSecondary: '#6b6b6b',
    background: '#f7f7f8',
    backgroundElement: '#ffffff',
    backgroundSelected: '#fff2e8',
    border: '#e2e2e5',
    accent: '#ea580c',
    accentHover: '#c2410c',
    accentLight: '#fff2e8',
    success: '#16a34a',
    error: '#dc2626',
    warning: '#b45309',
    surface: '#ffffff',
  },
  dark: {
    text: '#f5f5f5',
    textSecondary: '#a1a1aa',
    background: '#121212',
    backgroundElement: '#1c1c1e',
    backgroundSelected: '#3a2412',
    border: '#2e2e31',
    accent: '#f97316',
    accentHover: '#fb923c',
    accentLight: '#3a2412',
    success: '#22c55e',
    error: '#f87171',
    warning: '#fbbf24',
    surface: '#1c1c1e',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * CivicPulse's brand typeface — loaded via useFonts() in the root layout.
 * Falls back to the platform default until loaded (handled by SplashScreen).
 */
export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

/**
 * Buttons and inputs are square-cornered by design — no border radius.
 */
export const Radius = 0;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
