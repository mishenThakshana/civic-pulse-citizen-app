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
    setFieldErrors((prev) => (prev.name ? { ...prev, name: validateRequired(value, 'Full name') } : prev));
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setFieldErrors((prev) => (prev.email ? { ...prev, email: validateEmail(value) } : prev));
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    setFieldErrors((prev) => (prev.phone ? { ...prev, phone: validatePhone(value) } : prev));
  }

  function handleNicNumberChange(value: string) {
    setNicNumber(value);
    setFieldErrors((prev) => (prev.nicNumber ? { ...prev, nicNumber: validateNicNumber(value) } : prev));
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
      if (prev.password) next.password = validatePassword(value);
      if (prev.confirmPassword) next.confirmPassword = validatePasswordConfirmation(value, confirmPassword);
      return next;
    });
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value);
    setFieldErrors((prev) =>
      prev.confirmPassword ? { ...prev, confirmPassword: validatePasswordConfirmation(password, value) } : prev
    );
  }

  function runClientValidation(): boolean {
    const errors: FieldErrors = {
      name: validateRequired(name, 'Full name'),
      email: validateEmail(email),
      phone: validatePhone(phone),
      nicNumber: validateNicNumber(nicNumber),
      nicPhotoFront: nicPhotoFront ? null : 'NIC front photo is required.',
      nicPhotoBack: nicPhotoBack ? null : 'NIC back photo is required.',
      password: validatePassword(password),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword),
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
        setFormError(e instanceof ApiError ? e.firstError() : 'Unable to create your account. Please try again.');
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
        <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Registration requires a valid NIC. An administrator will review and approve your
          account before you can sign in.
        </Text>

        <View style={styles.form}>
          {formError ? (
            <View style={[styles.alert, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Text style={{ color: theme.error, fontSize: 13, fontFamily: FontFamily.regular }}>{formError}</Text>
            </View>
          ) : null}

          <TextField
            label="Full name"
            value={name}
            onChangeText={handleNameChange}
            placeholder="Nimal Perera"
            error={fieldErrors.name}
          />
          <TextField
            label="Email address"
            value={email}
            onChangeText={handleEmailChange}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={fieldErrors.email}
          />
          <TextField
            label="Phone number"
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="07XXXXXXXX"
            keyboardType="phone-pad"
            error={fieldErrors.phone}
          />
          <TextField
            label="NIC number"
            value={nicNumber}
            onChangeText={handleNicNumberChange}
            placeholder="e.g. 199012345678"
            autoCapitalize="characters"
            error={fieldErrors.nicNumber}
          />

          <NicPhotoPicker
            label="NIC front photo"
            value={nicPhotoFront}
            onChange={handleNicPhotoFrontChange}
            error={fieldErrors.nicPhotoFront}
          />
          <NicPhotoPicker
            label="NIC back photo"
            value={nicPhotoBack}
            onChange={handleNicPhotoBackChange}
            error={fieldErrors.nicPhotoBack}
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="At least 8 characters"
            secureTextEntry
            error={fieldErrors.password}
          />
          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            placeholder="Re-enter your password"
            secureTextEntry
            error={fieldErrors.confirmPassword}
          />

          <Button
            title="Create account"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={styles.submit}
          />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontFamily: FontFamily.regular }}>
            Already have an account?
          </Text>
          <Link href="/(auth)/login" style={{ color: theme.accent, fontFamily: FontFamily.semiBold, fontSize: 13 }}>
            Sign in
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
