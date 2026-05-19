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
    router.push(`${pathname}${period ? `?period=${period}` : ""}`);
  }

  const onThisMonth = current === thisMonthKey;
  const onAll = current === "all";
  const pastMonth = !onThisMonth && !onAll ? current : "";

  const seg = (activeFlag: boolean) =>
    `px-3.5 py-1.5 text-sm font-medium transition-colors ${
      activeFlag
        ? "bg-primary/15 text-primary-bright"
        : "text-muted hover:bg-surface-2 hover:text-text"
    }`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-lg border border-border bg-surface">
        <button onClick={() => go(thisMonthKey)} className={seg(onThisMonth)}>
          This Month
        </button>
        <button
          onClick={() => go("all")}
          className={`border-l border-border ${seg(onAll)}`}
        >
          All Time
        </button>
      </div>

      <select
        value={pastMonth}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="input w-auto cursor-pointer py-1.5 text-sm"
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
