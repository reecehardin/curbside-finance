const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";

const moneyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
});

const moneyCompactFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "$1,234.50" */
export function formatMoney(amount: number): string {
  return moneyFmt.format(amount);
}

/** "$1.2K" — for chart axes and tight spaces. */
export function formatMoneyCompact(amount: number): string {
  return moneyCompactFmt.format(amount);
}

/** "May 18, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
