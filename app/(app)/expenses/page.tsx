import PageHeader from "@/components/PageHeader";
import PeriodToggle from "@/components/PeriodToggle";
import TransactionTable from "@/components/TransactionTable";
import EmptyState from "@/components/EmptyState";
import AddExpenseModal from "@/components/AddExpenseModal";
import { getTransactions } from "@/lib/queries";
import { resolvePeriod, listRecentMonths } from "@/lib/period";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = resolvePeriod(periodParam);
  const thisMonth = resolvePeriod();
  const rows = await getTransactions(period, { type: "expense" });

  const total = rows.reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${period.label} · ${formatMoney(total)} across ${rows.length} ${rows.length === 1 ? "entry" : "entries"}`}
      >
        <PeriodToggle
          current={period.key}
          thisMonthKey={thisMonth.key}
          months={listRecentMonths(12)}
        />
        <AddExpenseModal />
      </PageHeader>

      {rows.length ? (
        <TransactionTable rows={rows} variant="expense" />
      ) : (
        <EmptyState message="No expenses for this period. Use “Add Expense” to record one." />
      )}
    </>
  );
}
