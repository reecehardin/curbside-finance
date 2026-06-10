"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { deleteRecurring, toggleRecurring } from "@/lib/recurring-actions";
import { formatDate, formatMoney } from "@/lib/format";
import type { RecurringExpense } from "@/lib/types";
import RecurringModal from "./RecurringModal";

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : ["th", "st", "nd", "rd"][Math.min(n % 10, 4)] ?? "th";
  return `${n}${suffix}`;
}

function originalPrice(sub: RecurringExpense): string | null {
  if (!sub.original_amount || !sub.original_currency) return null;
  const symbol =
    sub.original_currency === "EUR"
      ? "€"
      : sub.original_currency === "GBP"
        ? "£"
        : `${sub.original_currency} `;
  return `${symbol}${Number(sub.original_amount).toFixed(2)}`;
}

export default function RecurringTable({ rows }: { rows: RecurringExpense[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onToggle(sub: RecurringExpense) {
    setBusyId(sub.id);
    await toggleRecurring(sub.id, !sub.active);
    setBusyId(null);
    router.refresh();
  }

  async function onDelete(sub: RecurringExpense) {
    if (!confirm(`Delete "${sub.name}"? Past posted expenses are kept.`)) return;
    setBusyId(sub.id);
    await deleteRecurring(sub.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <Th>Subscription</Th>
            <Th>Category</Th>
            <Th>Bills on</Th>
            <Th>Next charge</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Status</Th>
            <Th className="text-right"></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sub) => {
            const orig = originalPrice(sub);
            const busy = busyId === sub.id;
            return (
              <tr
                key={sub.id}
                className={`border-b border-border/70 transition-colors last:border-0 hover:bg-surface-2/60 ${
                  sub.active ? "" : "opacity-50"
                }`}
              >
                <td className="px-4 py-3 text-text">
                  {sub.name}
                  {orig && (
                    <span className="ml-2 text-xs text-muted-2">({orig}/mo)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {sub.category || "Uncategorized"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {ordinal(sub.billing_day)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {sub.active ? formatDate(`${sub.next_billing_date}T12:00:00Z`) : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-display font-semibold text-expense">
                  −{formatMoney(Number(sub.amount))}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`rounded px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide ${
                      sub.active
                        ? "bg-income/12 text-income"
                        : "bg-surface-2 text-muted-2"
                    }`}
                  >
                    {sub.active ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <RecurringModal initial={sub} />
                    <button
                      onClick={() => onToggle(sub)}
                      disabled={busy}
                      className="text-muted-2 transition-colors hover:text-text disabled:opacity-40"
                      aria-label={sub.active ? `Pause ${sub.name}` : `Resume ${sub.name}`}
                    >
                      {sub.active ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                      onClick={() => onDelete(sub)}
                      disabled={busy}
                      className="text-muted-2 transition-colors hover:text-expense disabled:opacity-40"
                      aria-label={`Delete ${sub.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 font-display text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-2 ${className}`}
    >
      {children}
    </th>
  );
}
