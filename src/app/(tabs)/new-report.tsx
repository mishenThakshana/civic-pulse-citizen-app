import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AiScanModal, type AiScanPhase } from '@/components/ai-scan-modal';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { LocationChip } from '@/components/location-chip';
import { ReportPhotoPicker, type ReportPhoto } from '@/components/report-photo-picker';
import { FontFamily, Spacing } from '@/constants/theme';
import { useCurrentLocation } from '@/context/location-context';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import { categoryName } from '@/lib/format';
import { ApiError, useAuth } from '@/context/auth-context';
import { createReport, listCategories } from '@/lib/reports';
import type { Category } from '@/types/api';

export default function NewReportScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const location = useCurrentLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [photo, setPhoto] = useState<ReportPhoto | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  // Prefilled with the citizen's account phone — they can still edit it in case
  // they want the government to reach them on a different number for this report.
  const [contactPhone, setContactPhone] = useState(() => user?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<{ phase: AiScanPhase; message: string | null } | null>(null);

  // GPS resolves asynchronously after mount, so the detected "street, area" only
  // becomes available a moment later — prefill the field with it once it does,
  // but never overwrite text the citizen has already typed themselves.
  const addressEditedRef = useRef(false);
  useEffect(() => {
    if (location.address && !addressEditedRef.current) setAddress(location.address);
  }, [location.address]);

  function handleAddressChange(value: string) {
    addressEditedRef.current = true;
    setAddress(value);
  }

  useEffect(() => {
    listCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const canSubmit =
    photo !== null &&
    description.trim().length > 0 &&
    address.trim().length > 0 &&
    contactPhone.trim().length > 0 &&
    location.coords !== null;

  async function handleSubmit() {
    if (!canSubmit || !photo || !location.coords) return;

    setError(null);
    setSubmitting(true);
    setScan({ phase: 'scanning', message: null });
    try {
      await createReport({
        categoryId,
        description: description.trim(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address.trim(),
        contactPhone: contactPhone.trim(),
        photo,
      });

      setScan({ phase: 'approved', message: null });
      await new Promise((resolve) => setTimeout(resolve, 1600));
      setScan(null);

      setPhoto(null);
      setDescription('');
      setAddress(location.address ?? '');
      addressEditedRef.current = false;
      setCategoryId(null);
      router.replace('/(tabs)');
    } catch (e) {
      // The backend runs the AI screening before saving anything and reports a
      // rejection (spam, or screening unavailable) under the "screening" key.
      if (e instanceof ApiError && e.errors?.screening) {
        setScan({ phase: 'rejected', message: e.firstError() });
      } else {
        setScan(null);
        setError(e instanceof ApiError ? e.firstError() : t('newReport.failed'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.four }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>{t('newReport.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('newReport.subtitle')}
        </Text>

        {error ? (
          <View style={[styles.alert, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={{ color: theme.error, fontSize: 13, fontFamily: FontFamily.regular }}>{error}</Text>
          </View>
        ) : null}

        {location.status === 'resolved' ? (
          <>
            <ReportPhotoPicker value={photo} onChange={setPhoto} />

            <View style={styles.locationSection}>
              <Text style={[styles.label, { color: theme.text }]}>{t('newReport.whereIsIt')}</Text>
              <LocationChip status={location.status} city={location.city} onPress={location.refresh} />
              <TextField
                label={location.city ? t('newReport.whereInCity', { city: location.city }) : t('newReport.whereExactly')}
                value={address}
                onChangeText={handleAddressChange}
                placeholder={t('newReport.addressPlaceholder')}
              />
            </View>

            <View style={styles.categorySection}>
              <Text style={[styles.label, { color: theme.text }]}>{t('newReport.categoryLabel')}</Text>
              <View style={styles.chipRow}>
                {categories.map((category) => {
                  const selected = category.id === categoryId;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setCategoryId(selected ? null : category.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? theme.accent : theme.surface,
                          borderColor: selected ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: selected ? '#fff' : theme.text }]}>{categoryName(category, t)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TextField
              label={t('newReport.describe')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('newReport.describePlaceholder')}
              multiline
              numberOfLines={4}
              style={styles.descriptionInput}
            />

            <TextField
              label={t('newReport.contactPhone')}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="07XXXXXXXX"
              keyboardType="phone-pad"
            />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {t('newReport.contactHint')}
            </Text>

            <Button
              title={t('newReport.submit')}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
              style={styles.submit}
            />
          </>
        ) : (
          <LocationGate location={location} />
        )}
      </ScrollView>

      <AiScanModal
        visible={scan !== null}
        phase={scan?.phase ?? 'scanning'}
        photoUri={photo?.uri ?? null}
        message={scan?.message}
        onDismiss={() => setScan(null)}
      />
    </KeyboardAvoidingView>
  );
}

function LocationGate({ location }: { location: ReturnType<typeof useCurrentLocation> }) {
  const theme = useTheme();
  const { t } = useLanguage();

  if (location.status === 'locating') {
    return (
      <View style={[styles.gate, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ActivityIndicator color={theme.accent} />
        <Text style={[styles.gateTitle, { color: theme.text }]}>{t('newReport.locatingTitle')}</Text>
        <Text style={[styles.gateBody, { color: theme.textSecondary }]}>
          {t('newReport.locatingBody')}
        </Text>
      </View>
    );
  }

  const config =
    location.status === 'permission-denied'
      ? {
          icon: 'location-outline' as const,
          title: t('newReport.permissionTitle'),
          body: t('newReport.permissionBody'),
          actionLabel: location.canAskAgain ? t('newReport.allowLocation') : t('newReport.openSettings'),
          onAction: location.canAskAgain ? location.refresh : () => Linking.openSettings(),
        }
      : location.status === 'services-disabled'
        ? {
            icon: 'navigate-outline' as const,
            title: t('newReport.gpsOffTitle'),
            body: t('newReport.gpsOffBody'),
            actionLabel: t('newReport.turnOnLocation'),
            onAction: location.enableLocationServices,
          }
        : {
            icon: 'alert-circle-outline' as const,
            title: t('newReport.locationErrorTitle'),
            body: t('newReport.locationErrorBody'),
            actionLabel: t('common.tryAgain'),
            onAction: location.refresh,
          };

  return (
    <View style={[styles.gate, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name={config.icon} size={26} color={theme.accent} />
      <Text style={[styles.gateTitle, { color: theme.text }]}>{config.title}</Text>
      <Text style={[styles.gateBody, { color: theme.textSecondary }]}>{config.body}</Text>
      <Button title={config.actionLabel} onPress={config.onAction} style={styles.gateButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  title: { fontSize: 20, fontFamily: FontFamily.bold },
  subtitle: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: -Spacing.two, lineHeight: 19 },
  label: { fontSize: 13, fontFamily: FontFamily.medium, marginBottom: 8 },
  alert: { borderWidth: 1, borderRadius: 8, padding: 10 },
  locationSection: { gap: 10 },
  gate: { borderWidth: 1, borderRadius: 12, padding: Spacing.four, alignItems: 'center', gap: 6 },
  gateTitle: { fontSize: 15, fontFamily: FontFamily.semiBold, textAlign: 'center', marginTop: 4 },
  gateBody: { fontSize: 13, fontFamily: FontFamily.regular, textAlign: 'center', lineHeight: 18 },
  gateButton: { alignSelf: 'stretch', marginTop: Spacing.two },
  categorySection: {},
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, lineHeight: 16, fontFamily: FontFamily.medium, includeFontPadding: false },
  descriptionInput: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  hint: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: -Spacing.two },
  submit: { marginTop: Spacing.two },
});
