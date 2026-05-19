import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export default function RecentActivity({ items }: { items: Transaction[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((t) => {
        const isIncome = t.type === "income";
        const refunded = t.status === "refunded";
        return (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm ${
                isIncome
                  ? "bg-accent/15 text-income"
                  : "bg-expense/15 text-expense"
              }`}
            >
              {isIncome ? "↓" : "↑"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">
                {t.description}
                {refunded && (
                  <span className="ml-2 rounded bg-expense/15 px-1.5 py-0.5 text-[10px] uppercase text-expense">
                    Refunded
                  </span>
                )}
              </div>
              <div className="text-xs text-muted">
                {t.customer_name || t.category || (isIncome ? "Tebex" : "Manual")}
                {" · "}
                {formatDate(t.occurred_at)}
              </div>
            </div>
            <span
              className={`shrink-0 text-sm font-semibold ${
                refunded
                  ? "text-muted line-through"
                  : isIncome
                    ? "text-income"
                    : "text-expense"
              }`}
            >
              {isIncome ? "+" : "−"}
              {formatMoney(Number(t.amount))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
