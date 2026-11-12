import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NicPhotoPicker, type NicFile } from '@/components/nic-photo-picker';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Spacing } from '@/constants/theme';
import { ApiError, useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import {
  validateEmail,
  validateNicNumber,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
  validateRequired,
} from '@/lib/validation';

type FieldErrors = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  nicNumber?: string | null;
  nicPhotoFront?: string | null;
  nicPhotoBack?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
};

// Maps the API's snake_case field names to our local error-state keys.
const API_FIELD_MAP: Record<string, keyof FieldErrors> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  nic_number: 'nicNumber',
  nic_photo_front: 'nicPhotoFront',
  nic_photo_back: 'nicPhotoBack',
  password: 'password',
};

export default function RegisterScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [nicPhotoFront, setNicPhotoFront] = useState<NicFile | null>(null);
  const [nicPhotoBack, setNicPhotoBack] = useState<NicFile | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    nicNumber.trim().length > 0 &&
    nicPhotoFront !== null &&
    nicPhotoBack !== null &&
    password.length > 0 &&
    confirmPassword.length > 0;

  function handleNameChange(value: string) {
    setName(value);
    setFieldErrors((prev) => (prev.name ? { ...prev, name: validateRequired(value, t('register.fullName'), t) } : prev));
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setFieldErrors((prev) => (prev.email ? { ...prev, email: validateEmail(value, t) } : prev));
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    setFieldErrors((prev) => (prev.phone ? { ...prev, phone: validatePhone(value, t) } : prev));
  }

  function handleNicNumberChange(value: string) {
    setNicNumber(value);
    setFieldErrors((prev) => (prev.nicNumber ? { ...prev, nicNumber: validateNicNumber(value, t) } : prev));
  }

  function handleNicPhotoFrontChange(file: NicFile | null) {
    setNicPhotoFront(file);
    setFieldErrors((prev) => (prev.nicPhotoFront ? { ...prev, nicPhotoFront: null } : prev));
  }

  function handleNicPhotoBackChange(file: NicFile | null) {
    setNicPhotoBack(file);
    setFieldErrors((prev) => (prev.nicPhotoBack ? { ...prev, nicPhotoBack: null } : prev));
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setFieldErrors((prev) => {
      if (!prev.password && !prev.confirmPassword) return prev;
      const next = { ...prev };
      if (prev.password) next.password = validatePassword(value, t);
      if (prev.confirmPassword) next.confirmPassword = validatePasswordConfirmation(value, confirmPassword, t);
      return next;
    });
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value);
    setFieldErrors((prev) =>
      prev.confirmPassword ? { ...prev, confirmPassword: validatePasswordConfirmation(password, value, t) } : prev
    );
  }

  function runClientValidation(): boolean {
    const errors: FieldErrors = {
      name: validateRequired(name, t('register.fullName'), t),
      email: validateEmail(email, t),
      phone: validatePhone(phone, t),
      nicNumber: validateNicNumber(nicNumber, t),
      nicPhotoFront: nicPhotoFront ? null : t('register.nicFrontRequired'),
      nicPhotoBack: nicPhotoBack ? null : t('register.nicBackRequired'),
      password: validatePassword(password, t),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword, t),
    };
    setFieldErrors(errors);
    return Object.values(errors).every((message) => !message);
  }

  async function handleSubmit() {
    setFormError(null);

    if (!runClientValidation()) return;
    if (!nicPhotoFront || !nicPhotoBack) return;

    setLoading(true);
    try {
      const message = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nicNumber: nicNumber.trim(),
        nicPhotoFront,
        nicPhotoBack,
        password,
        passwordConfirmation: confirmPassword,
      });
      router.replace({ pathname: '/(auth)/pending', params: { message } });
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const mapped: FieldErrors = {};
        for (const [apiField, messages] of Object.entries(e.errors)) {
          const key = API_FIELD_MAP[apiField];
          if (key && messages[0]) mapped[key] = messages[0];
        }
        setFieldErrors((prev) => ({ ...prev, ...mapped }));
        setFormError(Object.keys(mapped).length ? null : e.firstError());
      } else {
        setFormError(e instanceof ApiError ? e.firstError() : t('register.failed'));
      }
    } finally {
      setLoading(false);
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
        <Text style={[styles.title, { color: theme.text }]}>{t('register.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('register.subtitle')}
        </Text>

        <View style={styles.form}>
          {formError ? (
            <View style={[styles.alert, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Text style={{ color: theme.error, fontSize: 13, fontFamily: FontFamily.regular }}>{formError}</Text>
            </View>
          ) : null}

          <TextField
            label={t('register.fullName')}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Nimal Perera"
            error={fieldErrors.name}
          />
          <TextField
            label={t('register.email')}
            value={email}
            onChangeText={handleEmailChange}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={fieldErrors.email}
          />
          <TextField
            label={t('register.phone')}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="07XXXXXXXX"
            keyboardType="phone-pad"
            error={fieldErrors.phone}
          />
          <TextField
            label={t('register.nicNumber')}
            value={nicNumber}
            onChangeText={handleNicNumberChange}
            placeholder={t('register.nicNumberPlaceholder')}
            autoCapitalize="characters"
            error={fieldErrors.nicNumber}
          />

          <NicPhotoPicker
            label={t('register.nicFront')}
            value={nicPhotoFront}
            onChange={handleNicPhotoFrontChange}
            error={fieldErrors.nicPhotoFront}
          />
          <NicPhotoPicker
            label={t('register.nicBack')}
            value={nicPhotoBack}
            onChange={handleNicPhotoBackChange}
            error={fieldErrors.nicPhotoBack}
          />

          <TextField
            label={t('register.password')}
            value={password}
            onChangeText={handlePasswordChange}
            placeholder={t('register.passwordPlaceholder')}
            secureTextEntry
            error={fieldErrors.password}
          />
          <TextField
            label={t('register.confirmPassword')}
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            placeholder={t('register.confirmPasswordPlaceholder')}
            secureTextEntry
            error={fieldErrors.confirmPassword}
          />

          <Button
            title={t('register.submit')}
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={styles.submit}
          />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontFamily: FontFamily.regular }}>
            {t('register.haveAccount')}
          </Text>
          <Link href="/(auth)/login" style={{ color: theme.accent, fontFamily: FontFamily.semiBold, fontSize: 13 }}>
            {t('register.signIn')}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontFamily: FontFamily.bold, textAlign: 'center' },
  subtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 6,
    marginBottom: Spacing.five,
    textAlign: 'center',
    lineHeight: 19,
  },
  form: { width: '100%', maxWidth: 360, gap: Spacing.three },
  submit: { marginTop: Spacing.two },
  alert: { borderWidth: 1, borderRadius: 8, padding: 10 },
  footer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.five,
    alignItems: 'center',
  },
});
