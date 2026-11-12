import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';

export type AiScanPhase = 'scanning' | 'approved' | 'rejected';

type AiScanModalProps = {
  visible: boolean;
  phase: AiScanPhase;
  photoUri: string | null;
  message?: string | null;
  onDismiss: () => void;
};

const STEP_INTERVAL_MS = 1400;
const PREVIEW_HEIGHT = 180;

/**
 * Shown while a new report is in flight. The whole check is a single request
 * (the backend runs the AI pipeline before saving anything), so the steps are
 * paced on a timer and the last one waits on the real result.
 */
export function AiScanModal({ visible, phase, photoUri, message, onDismiss }: AiScanModalProps) {
  const theme = useTheme();
  const { t, strings } = useLanguage();
  const STEPS = strings.scan.steps;
  const [step, setStep] = useState(0);
  const [sweep] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible || phase !== 'scanning') return;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      setStep(0);
    };
  }, [visible, phase, STEPS.length]);

  useEffect(() => {
    if (!visible || phase !== 'scanning') return;
    const sweepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    sweepLoop.start();
    pulseLoop.start();
    return () => {
      sweepLoop.stop();
      pulseLoop.stop();
    };
  }, [visible, phase, sweep, pulse]);

  const scanning = phase === 'scanning';
  const statusColor = phase === 'approved' ? theme.success : phase === 'rejected' ? theme.error : theme.accent;
  const title = scanning ? t('scan.scanningTitle') : phase === 'approved' ? t('scan.approvedTitle') : t('scan.rejectedTitle');
  const subtitle = scanning
    ? t('scan.scanningBody')
    : phase === 'approved'
      ? t('scan.approvedBody')
      : message ?? t('scan.rejectedBody');

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={scanning ? () => {} : onDismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.preview, { borderColor: statusColor }]}>
            {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
            {scanning ? (
              <>
                <View style={[StyleSheet.absoluteFill, styles.tint]} />
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      backgroundColor: theme.accent,
                      shadowColor: theme.accent,
                      transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [0, PREVIEW_HEIGHT - 3] }) }],
                    },
                  ]}
                />
                <Animated.View style={[styles.badge, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }]}>
                  <Ionicons name="scan-outline" size={14} color="#fff" />
                  <Text style={styles.badgeText}>{t('scan.badge')}</Text>
                </Animated.View>
              </>
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.result, { backgroundColor: `${statusColor}cc` }]}>
                <Ionicons name={phase === 'approved' ? 'shield-checkmark' : 'warning'} size={56} color="#fff" />
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>

          {scanning ? (
            <View style={styles.steps}>
              {STEPS.map((label, index) => {
                const done = index < step;
                const active = index === step;
                return (
                  <View key={label} style={styles.stepRow}>
                    {done ? (
                      <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                    ) : active ? (
                      <ActivityIndicator size="small" color={theme.accent} style={styles.stepIcon} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={18} color={theme.border} />
                    )}
                    <Text
                      style={[
                        styles.stepText,
                        { color: done || active ? theme.text : theme.textSecondary, fontFamily: active ? FontFamily.semiBold : FontFamily.regular },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : phase === 'rejected' ? (
            <Button title={t('scan.edit')} onPress={onDismiss} style={styles.action} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.four },
  card: { borderWidth: 1, borderRadius: 16, padding: Spacing.four, gap: Spacing.two },
  preview: { height: PREVIEW_HEIGHT, borderRadius: 12, borderWidth: 2, overflow: 'hidden', marginBottom: Spacing.two, backgroundColor: '#000' },
  tint: { backgroundColor: 'rgba(234,88,12,0.12)' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 3, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, letterSpacing: 1, fontFamily: FontFamily.bold },
  result: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontFamily: FontFamily.bold, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: FontFamily.regular, textAlign: 'center', lineHeight: 19 },
  steps: { gap: 10, marginTop: Spacing.two },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon: { width: 18, height: 18 },
  stepText: { fontSize: 13, flexShrink: 1 },
  action: { marginTop: Spacing.two },
});
