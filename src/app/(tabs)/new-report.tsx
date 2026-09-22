import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { LocationChip } from '@/components/location-chip';
import { ReportPhotoPicker, type ReportPhoto } from '@/components/report-photo-picker';
import { FontFamily, Spacing } from '@/constants/theme';
import { useCurrentLocation } from '@/context/location-context';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, useAuth } from '@/context/auth-context';
import { createReport, listCategories } from '@/lib/reports';
import type { Category } from '@/types/api';

export default function NewReportScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const location = useCurrentLocation();
  const { user } = useAuth();

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

      setPhoto(null);
      setDescription('');
      setAddress(location.address ?? '');
      addressEditedRef.current = false;
      setCategoryId(null);
      Alert.alert('Report sent', 'Your report has been submitted and is now visible on the Home feed.');
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.firstError() : 'Unable to submit your report. Please try again.');
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
        <Text style={[styles.title, { color: theme.text }]}>Report an issue</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Takes under a minute. A photo and a quick description of where it is is enough.
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
              <Text style={[styles.label, { color: theme.text }]}>Where is it</Text>
              <LocationChip status={location.status} city={location.city} onPress={location.refresh} />
              <TextField
                label={location.city ? `Where in ${location.city}?` : 'Where is it, exactly?'}
                value={address}
                onChangeText={handleAddressChange}
                placeholder="Street, landmark, nearest junction…"
              />
            </View>

            <View style={styles.categorySection}>
              <Text style={[styles.label, { color: theme.text }]}>What kind of problem is it (optional)</Text>
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
                      <Text style={[styles.chipText, { color: selected ? '#fff' : theme.text }]}>{category.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TextField
              label="Describe it briefly"
              value={description}
              onChangeText={setDescription}
              placeholder="What's wrong, and why it matters…"
              multiline
              numberOfLines={4}
              style={styles.descriptionInput}
            />

            <TextField
              label="Contact phone"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="07XXXXXXXX"
              keyboardType="phone-pad"
            />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              The government may need to call you about this report.
            </Text>

            <Button
              title="Send report"
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
    </KeyboardAvoidingView>
  );
}

function LocationGate({ location }: { location: ReturnType<typeof useCurrentLocation> }) {
  const theme = useTheme();

  if (location.status === 'locating') {
    return (
      <View style={[styles.gate, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ActivityIndicator color={theme.accent} />
        <Text style={[styles.gateTitle, { color: theme.text }]}>Finding your location…</Text>
        <Text style={[styles.gateBody, { color: theme.textSecondary }]}>
          CivicPulse needs your GPS location to attach it to your report.
        </Text>
      </View>
    );
  }

  const config =
    location.status === 'permission-denied'
      ? {
          icon: 'location-outline' as const,
          title: 'Location permission needed',
          body: 'Allow CivicPulse to access your location so we can attach it to your report.',
          actionLabel: location.canAskAgain ? 'Allow location access' : 'Open settings',
          onAction: location.canAskAgain ? location.refresh : () => Linking.openSettings(),
        }
      : location.status === 'services-disabled'
        ? {
            icon: 'navigate-outline' as const,
            title: 'Turn on GPS / Location',
            body: "Your device's Location is switched off. Turn it on so we can find where you are.",
            actionLabel: 'Turn on location',
            onAction: location.enableLocationServices,
          }
        : {
            icon: 'alert-circle-outline' as const,
            title: "Couldn't get your location",
            body: 'Something went wrong while finding your location. Check your connection and try again.',
            actionLabel: 'Try again',
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
