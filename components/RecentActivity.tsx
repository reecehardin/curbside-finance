import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export default function RecentActivity({ items }: { items: Transaction[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((t) => {
        const isIncome = t.type === "income";
        const refunded = t.status === "refunded";
        const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
        return (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                isIncome
                  ? "bg-income/12 text-income"
                  : "bg-expense/12 text-expense"
              }`}
            >
              <Icon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 truncate text-sm text-text">
                <span className="truncate">{t.description}</span>
                {refunded && (
                  <span className="shrink-0 rounded bg-expense/15 px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide text-expense">
                    Refunded
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-2">
                {t.customer_name || t.category || (isIncome ? "Tebex" : "Manual")}
                {" · "}
                {formatDate(t.occurred_at)}
              </div>
            </div>
            <span
              className={`shrink-0 font-display text-sm font-semibold ${
                refunded
                  ? "text-muted-2 line-through"
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
