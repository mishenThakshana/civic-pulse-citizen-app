const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sri Lankan NIC: old format is 9 digits + V/X, new format is 12 digits.
const NIC_PATTERN = /^(?:\d{9}[VvXx]|\d{12})$/;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email address is required.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address.';
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required.`;
}

export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'Phone number is required.';
  if (digits.length < 9 || digits.length > 12) return 'Enter a valid phone number.';
  return null;
}

export function validateNicNumber(value: string): string | null {
  if (!value.trim()) return 'NIC number is required.';
  if (!NIC_PATTERN.test(value.trim())) {
    return 'Enter a valid NIC number (9 digits + V/X, or 12 digits).';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (!confirmation) return 'Please confirm your password.';
  if (password !== confirmation) return 'Passwords do not match.';
  return null;
}
