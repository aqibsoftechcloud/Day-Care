/**
 * Phone normalization for the consultation form. Pure and dependency-free
 * so the browser (inline errors) and the server (the only authority)
 * apply exactly the same rules.
 *
 * Output is always `+{countryCode}{nationalNumber}` — one consistent
 * stored format regardless of how the visitor typed it.
 */
export type PhoneResult = { ok: true; value: string } | { ok: false; message: string };

export function normalizePhone(input: string, countryCode: string): PhoneResult {
  const cc = countryCode.replace(/\D/g, "");
  let digits = input.replace(/\D/g, "");
  const typedPlus = input.trim().startsWith("+");

  if (!digits) {
    return { ok: false, message: "Enter your phone number." };
  }

  // A visitor who typed "+91 98765 43210" (or 0091...) included the country code themselves.
  if (digits.startsWith("00" + cc)) digits = digits.slice(2 + cc.length);
  else if (typedPlus && digits.startsWith(cc)) digits = digits.slice(cc.length);
  else if (cc === "91" && digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);

  // Domestic trunk prefix (0), e.g. "098765 43210".
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");

  if (cc === "91") {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return { ok: false, message: "Enter a valid 10-digit mobile number." };
    }
  } else if (digits.length < 6 || digits.length > 12) {
    return { ok: false, message: "Enter a valid phone number." };
  }

  return { ok: true, value: `+${cc}${digits}` };
}
