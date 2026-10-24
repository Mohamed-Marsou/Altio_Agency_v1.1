// =============================================================================
// PHONE NUMBERS (Morocco first, other countries accepted)
// -----------------------------------------------------------------------------
// People type numbers in many ways:  06 12 34 56 78 · 0612345678 · +212 6 12 34 56 78
// · 00212612345678 · 612345678 · +33 6 12 34 56 78 (a client abroad).
// normalizePhone() turns every valid one into the international form
// "+212612345678" (what WhatsApp needs) and returns null for anything else.
// =============================================================================

// Moroccan numbers have 9 digits after the country code. They start with
// 5 (landline), 6 or 7 (mobile) or 8 (special services).
const MOROCCO_NATIONAL = /^[5-8]\d{8}$/;

/** "+212612345678" for a valid number, otherwise null. */
export function normalizePhone(input: string): string | null {
  // Remove what people use to make a number readable.
  let value = input.trim().replace(/[\s().\- ]/g, "");
  if (!value) return null;

  // 00 is the old way of writing +
  if (value.startsWith("00")) value = `+${value.slice(2)}`;

  if (value.startsWith("+")) {
    const digits = value.slice(1);
    if (!/^\d+$/.test(digits)) return null;

    if (digits.startsWith("212")) {
      // People often write +212 0612...: the 0 is not part of the international form.
      let national = digits.slice(3);
      if (national.length === 10 && national.startsWith("0")) national = national.slice(1);
      return MOROCCO_NATIONAL.test(national) ? `+212${national}` : null;
    }

    // Another country: 8 to 15 digits, not starting with 0 (international standard, E.164).
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }

  if (!/^\d+$/.test(value)) return null;
  // 0612345678
  if (/^0[5-8]\d{8}$/.test(value)) return `+212${value.slice(1)}`;
  // 212612345678
  if (/^212[5-8]\d{8}$/.test(value)) return `+${value}`;
  // 612345678
  if (MOROCCO_NATIONAL.test(value)) return `+212${value}`;
  return null;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** "+212612345678" -> "+212 6 12 34 56 78" (easier to read in a message). */
export function formatPhone(e164: string): string {
  const match = /^\+212([5-8])(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(e164);
  return match ? `+212 ${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}` : e164;
}
