import PageHeader from "@/components/PageHeader";
import PeriodToggle from "@/components/PeriodToggle";
import TransactionTable from "@/components/TransactionTable";
import EmptyState from "@/components/EmptyState";
import { getTransactions } from "@/lib/queries";
import { resolvePeriod, listRecentMonths } from "@/lib/period";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = resolvePeriod(periodParam);
  const thisMonth = resolvePeriod();
  const rows = await getTransactions(period, { type: "income" });

  const total = rows
    .filter((t) => t.status === "completed")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <>
      <PageHeader
        title="Income"
        subtitle={`${period.label} · ${formatMoney(total)} from ${rows.length} donation${rows.length === 1 ? "" : "s"}`}
      >
        <PeriodToggle
          current={period.key}
          thisMonthKey={thisMonth.key}
          months={listRecentMonths(12)}
        />
      </PageHeader>

      {rows.length ? (
        <TransactionTable rows={rows} variant="income" />
      ) : (
        <EmptyState message="No Tebex donations recorded for this period yet." />
      )}
    </>
  );
}
