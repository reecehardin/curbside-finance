export interface Period {
  /** "all" or "YYYY-MM" */
  key: string;
  /** Human label, e.g. "All Time" or "May 2026" */
  label: string;
  /** Inclusive lower bound (ISO) — null for all-time */
  start: string | null;
  /** Exclusive upper bound (ISO) — null for all-time */
  end: string | null;
  isAll: boolean;
}

/**
 * Resolves a `?period=` query value into a Period.
 * Accepts "all" or "YYYY-MM"; anything else falls back to the current month.
 */
export function resolvePeriod(param?: string | null): Period {
  if (param === "all") {
    return { key: "all", label: "All Time", start: null, end: null, isAll: true };
  }

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  const match = param?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]) - 1;
  }

  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));

  return {
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    label: start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    start: start.toISOString(),
    end: end.toISOString(),
    isAll: false,
  };
}

/** The current month plus the previous `count - 1` months, newest first. */
export function listRecentMonths(count = 12): { key: string; label: string }[] {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    });
  }
  return months;
}
