type Translate = (key: string, params?: Record<string, string | number>) => string;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sri Lankan NIC: old format is 9 digits + V/X, new format is 12 digits.
const NIC_PATTERN = /^(?:\d{9}[VvXx]|\d{12})$/;

export function validateEmail(value: string, t: Translate): string | null {
  if (!value.trim()) return t('validation.emailRequired');
  if (!EMAIL_PATTERN.test(value.trim())) return t('validation.emailInvalid');
  return null;
}

export function validateRequired(value: string, label: string, t: Translate): string | null {
  return value.trim() ? null : t('validation.required', { field: label });
}

export function validatePhone(value: string, t: Translate): string | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return t('validation.phoneRequired');
  if (digits.length < 9 || digits.length > 12) return t('validation.phoneInvalid');
  return null;
}

export function validateNicNumber(value: string, t: Translate): string | null {
  if (!value.trim()) return t('validation.nicRequired');
  if (!NIC_PATTERN.test(value.trim())) {
    return t('validation.nicInvalid');
  }
  return null;
}

export function validatePassword(value: string, t: Translate): string | null {
  if (!value) return t('validation.passwordRequired');
  if (value.length < 8) return t('validation.passwordShort');
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string, t: Translate): string | null {
  if (!confirmation) return t('validation.confirmRequired');
  if (password !== confirmation) return t('validation.passwordMismatch');
  return null;
}
