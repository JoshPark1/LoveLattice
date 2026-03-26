export function normalizePhoneNumber(phoneNumber) {
  if (typeof phoneNumber !== 'string') return null;

  const trimmed = phoneNumber.trim();
  if (!trimmed) return null;

  const hasLeadingPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) return null;

  // Default bare 10-digit numbers to US/Canada (+1) for smoother onboarding.
  if (!hasLeadingPlus && digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }

  // Accept US/Canada numbers entered with leading country code but no plus.
  if (!hasLeadingPlus && digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  // Preserve explicit US/Canada numbers that already include +1.
  if (hasLeadingPlus && digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  return null;
}

export function getPhoneValidationMessage() {
  return 'Please enter a valid US or Canada phone number. Use 10 digits or include +1.';
}
