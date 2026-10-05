// Decimal strings → integer minor units without floating point. JPY has 0 decimals, USD 2, etc.
export function currencyDigits(currency: string): number {
  try { return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2; }
  catch { return 2; }
}

export function toMinor(amount: string | number | null | undefined, currency: string): number | null {
  if (amount === null || amount === undefined) return null;
  const text = String(amount).trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  const digits = currencyDigits(currency);
  const negative = text.startsWith("-");
  const [whole, frac = ""] = text.replace("-", "").split(".");
  const kept = frac.padEnd(digits, "0").slice(0, digits);
  const rest = frac.slice(digits);
  let minor = Number(whole) * 10 ** digits + Number(kept || "0");
  if (rest && Number(rest[0]) >= 5) minor += 1; // round half up on the dropped digit
  return negative ? -minor : minor;
}

export function formatMinor(minor: number, currency: string): string {
  const digits = currencyDigits(currency);
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
}
