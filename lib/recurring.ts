/**
 * Pure date math for recurring monthly billing. All dates are YYYY-MM-DD
 * strings treated as UTC calendar dates — no Date arithmetic leaks timezones.
 */

function iso(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Days in a month; month1 is 1-12. */
function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Today as a YYYY-MM-DD UTC date string. */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "2026-06-22" → "2026-06-01" (the charge's calendar month, for idempotency). */
export function billingMonthOf(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/**
 * The month after `current`, on `billingDay` clamped to that month's length.
 * billingDay (not current's day) is the anchor, so a sub that bills on the
 * 31st returns to the 31st after passing through February.
 */
export function advanceBillingDate(current: string, billingDay: number): string {
  const [y, m] = current.split("-").map(Number);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return iso(nextY, nextM, Math.min(billingDay, daysInMonth(nextY, nextM)));
}

/**
 * First date on/after `today` that falls on `billingDay` (clamped). Used to
 * set next_billing_date when a subscription is created or its day changes.
 */
export function nextOccurrence(billingDay: number, today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const dayThisMonth = Math.min(billingDay, daysInMonth(y, m));
  if (d <= dayThisMonth) return iso(y, m, dayThisMonth);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return iso(nextY, nextM, Math.min(billingDay, daysInMonth(nextY, nextM)));
}
