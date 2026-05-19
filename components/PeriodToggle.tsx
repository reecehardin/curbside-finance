"use client";

import { useRouter, usePathname } from "next/navigation";

export default function PeriodToggle({
  current,
  thisMonthKey,
  months,
}: {
  current: string;
  thisMonthKey: string;
  months: { key: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  function go(period: string) {
    const qs = period ? `?period=${period}` : "";
    router.push(`${pathname}${qs}`);
  }

  const onThisMonth = current === thisMonthKey;
  const onAll = current === "all";
  // A past month is selected when it's neither the current month nor all-time.
  const pastMonth = !onThisMonth && !onAll ? current : "";

  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-lg border border-border">
        <button
          onClick={() => go(thisMonthKey)}
          className={`px-3 py-1.5 text-sm transition-colors ${
            onThisMonth
              ? "bg-accent/15 font-semibold text-accent-soft"
              : "text-muted hover:bg-surface-2"
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => go("all")}
          className={`border-l border-border px-3 py-1.5 text-sm transition-colors ${
            onAll
              ? "bg-accent/15 font-semibold text-accent-soft"
              : "text-muted hover:bg-surface-2"
          }`}
        >
          All Time
        </button>
      </div>

      <select
        value={pastMonth}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="input w-auto py-1.5 text-sm"
      >
        <option value="">Pick a month…</option>
        {months.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
