import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Spacing } from '@/constants/theme';
import { ApiError, useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import { validateEmail, validateRequired } from '@/lib/validation';

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  function handleEmailChange(value: string) {
    setEmail(value);
    setEmailError((prev) => (prev ? validateEmail(value, t) : prev));
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setPasswordError((prev) => (prev ? validateRequired(value, t('login.password'), t) : prev));
  }

  async function handleSubmit() {
    setError(null);

    const nextEmailError = validateEmail(email, t);
    const nextPasswordError = validateRequired(password, t('login.password'), t);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.firstError() : t('login.failed'));
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.six }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.languageRow}>
          <LanguageSwitcher />
        </View>

        <View style={[styles.logoBadge, { backgroundColor: theme.accent }]}>
          <Ionicons name="pulse" size={32} color="#fff" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>CivicPulse</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('login.tagline')}
        </Text>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.alert, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Text style={{ color: theme.error, fontSize: 13, fontFamily: FontFamily.regular }}>{error}</Text>
            </View>
          ) : null}

          <TextField
            label={t('login.email')}
            value={email}
            onChangeText={handleEmailChange}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={emailError}
          />
          <TextField
            label={t('login.password')}
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            error={passwordError}
          />

          <Button
            title={t('login.submit')}
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={styles.submit}
          />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontFamily: FontFamily.regular }}>
            {t('login.noAccount')}
          </Text>
          <Link
            href="/(auth)/register"
            style={{ color: theme.accent, fontFamily: FontFamily.semiBold, fontSize: 13 }}
          >
            {t('login.createOne')}
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
  languageRow: { alignSelf: 'stretch', alignItems: 'center', marginBottom: Spacing.five },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { fontSize: 24, fontFamily: FontFamily.bold },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: 6,
    marginBottom: Spacing.five,
    textAlign: 'center',
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
