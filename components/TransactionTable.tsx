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

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <Th>Date</Th>
            <Th>{isIncome ? "Package" : "Description"}</Th>
            <Th>{isIncome ? "Customer" : "Category"}</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">{isIncome ? "Status" : ""}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const refunded = t.status === "refunded";
            return (
              <tr
                key={t.id}
                className="border-b border-border/70 transition-colors last:border-0 hover:bg-surface-2/60"
              >
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {formatDate(t.occurred_at)}
                </td>
                <td className="px-4 py-3 text-text">{t.description}</td>
                <td className="px-4 py-3 text-muted">
                  {isIncome
                    ? t.customer_name || "—"
                    : t.category || "Uncategorized"}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-display font-semibold ${
                    refunded
                      ? "text-muted-2 line-through"
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
                    <span
                      className={`rounded px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide ${
                        refunded
                          ? "bg-expense/15 text-expense"
                          : "bg-income/12 text-income"
                      }`}
                    >
                      {refunded ? "Refunded" : "Completed"}
                    </span>
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

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
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
