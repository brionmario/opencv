/**
 * Contact-field checks for the résumé header.
 *
 * A wrong email or phone number is the one typo that costs an applicant the
 * interview, and it is invisible: the résumé still looks right. So these
 * checks exist to warn, never to block. Every one of them returns a message
 * to show beside the field, and nothing anywhere refuses to save, export or
 * share a document because a number looked odd. Someone typing an extension,
 * a second number or a format we have not thought of still gets their
 * résumé.
 */

/** A warning to show under a field, or null when the value looks fine. */
export type ContactWarning = string | null;

/**
 * Deliberately loose: one @, something before it, and a dotted domain after
 * it with a 2+ character last label. Chasing the full RFC grammar here would
 * reject addresses that work, which is the expensive direction to be wrong
 * in. This catches the typos people actually make, like a missing @ or
 * "gmail.con" with no dot left in the domain.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function validateEmail(value: string): ContactWarning {
  const email = value.trim();
  if (!email) return null; // empty is a choice, not a mistake
  if (!EMAIL_RE.test(email)) return "Invalid email address. Check for a missing @ or domain.";
  return null;
}

/**
 * Sri Lankan numbers, the local-candidate case this was asked for.
 *
 * A subscriber number is 9 digits after the country code (7X XXX XXXX for
 * mobiles, or a leading area code for landlines), written either as
 * +94 7X XXX XXXX or as 0 7X XXX XXXX. Both reduce to the same 9 digits, so
 * the check counts those and says which way the number is off.
 */
const LK_SUBSCRIBER_DIGITS = 9;

/** Digits only, so spaces, dashes, dots and brackets never fail a number. */
function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

export function validatePhone(value: string): ContactWarning {
  const phone = value.trim();
  if (!phone) return null;

  if (/[^\d\s()+.-]/.test(phone)) return "Phone number contains unexpected characters.";

  const digits = digitsOf(phone);
  if (!digits) return "Phone number has no digits.";

  // Which of these is a Sri Lankan number, written any of the ways people
  // write one. "00" on its own is the international prefix for somewhere
  // else, so it has to be ruled out before a leading 0 is read as the local
  // trunk prefix, or +44 dialled as 0044 would be measured against Sri
  // Lankan lengths.
  let lk: string | null = null;
  if (digits.startsWith("0094")) lk = digits.slice(4);
  else if (digits.startsWith("00")) lk = null;
  else if (digits.startsWith("94")) lk = digits.slice(2);
  else if (digits.startsWith("0")) lk = digits.slice(1);

  if (lk !== null) {
    if (lk.length === LK_SUBSCRIBER_DIGITS) return null;
    const diff = lk.length - LK_SUBSCRIBER_DIGITS;
    return diff > 0
      ? `Sri Lankan number has ${diff} digit${diff === 1 ? "" : "s"} too many (expected ${LK_SUBSCRIBER_DIGITS} after +94).`
      : `Sri Lankan number is ${-diff} digit${diff === -1 ? "" : "s"} short (expected ${LK_SUBSCRIBER_DIGITS} after +94).`;
  }

  // Any other country: E.164 allows 4 to 15 digits in total, and that is all
  // we can say without a country-by-country table. Foreign numbers are not
  // held to the Sri Lankan length.
  if (digits.length < 4) return "Phone number looks too short.";
  if (digits.length > 15) return "Phone number looks too long.";
  return null;
}
