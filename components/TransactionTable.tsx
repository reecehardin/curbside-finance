import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import DeleteExpenseButton from "./DeleteExpenseButton";

export default function TransactionTable({
  rows,
  variant,
}: {
  rows: Transaction[];
  variant: "income" | "expense";
}) {
  const isIncome = variant === "income";
  const detailHeader = isIncome ? "Customer" : "Category";

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-2">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">
              {isIncome ? "Package" : "Description"}
            </th>
            <th className="px-4 py-3 font-medium">{detailHeader}</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 text-right font-medium">
              {isIncome ? "Status" : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const refunded = t.status === "refunded";
            return (
              <tr
                key={t.id}
                className="border-b border-border last:border-0 hover:bg-surface-2"
              >
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {formatDate(t.occurred_at)}
                </td>
                <td className="px-4 py-3">{t.description}</td>
                <td className="px-4 py-3 text-muted">
                  {isIncome
                    ? t.customer_name || "—"
                    : t.category || "Uncategorized"}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                    refunded
                      ? "text-muted line-through"
                      : isIncome
                        ? "text-income"
                        : "text-expense"
                  }`}
                >
                  {isIncome ? "+" : "−"}
                  {formatMoney(Number(t.amount))}
                </td>
                <td className="px-4 py-3 text-right">
                  {isIncome ? (
                    refunded ? (
                      <span className="rounded bg-expense/15 px-2 py-0.5 text-[10px] uppercase text-expense">
                        Refunded
                      </span>
                    ) : (
                      <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] uppercase text-income">
                        Completed
                      </span>
                    )
                  ) : (
                    <DeleteExpenseButton id={t.id} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
