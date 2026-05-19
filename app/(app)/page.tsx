import PageHeader from "@/components/PageHeader";
import PeriodToggle from "@/components/PeriodToggle";
import SummaryCard from "@/components/SummaryCard";
import Panel from "@/components/Panel";
import EmptyState from "@/components/EmptyState";
import TopPackages from "@/components/TopPackages";
import RecentActivity from "@/components/RecentActivity";
import IncomeExpenseChart from "@/components/charts/IncomeExpenseChart";
import ExpenseDonut from "@/components/charts/ExpenseDonut";
import { getDashboardData } from "@/lib/queries";
import { resolvePeriod, listRecentMonths } from "@/lib/period";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = resolvePeriod(periodParam);
  const thisMonth = resolvePeriod();
  const data = await getDashboardData(period);
  const { totals } = data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={period.label}>
        <PeriodToggle
          current={period.key}
          thisMonthKey={thisMonth.key}
          months={listRecentMonths(12)}
        />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          tone="income"
          label="Income"
          value={formatMoney(totals.income)}
          hint={`${totals.incomeCount} donation${totals.incomeCount === 1 ? "" : "s"}`}
        />
        <SummaryCard
          tone="expense"
          label="Expenses"
          value={formatMoney(totals.expenses)}
          hint={`${totals.expenseCount} ${totals.expenseCount === 1 ? "entry" : "entries"}`}
        />
        <SummaryCard
          tone="profit"
          label="Net Profit"
          value={formatMoney(totals.profit)}
          hint={`${Math.round(totals.margin * 100)}% margin`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Income vs Expenses" className="lg:col-span-2">
          {data.series.some((p) => p.income || p.expenses) ? (
            <IncomeExpenseChart data={data.series} />
          ) : (
            <EmptyState message="No activity in this period yet." />
          )}
        </Panel>
        <Panel title="Top Packages">
          {data.topPackages.length ? (
            <TopPackages items={data.topPackages} />
          ) : (
            <EmptyState message="No income yet." />
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Expenses by Category">
          {data.expenseCategories.length ? (
            <ExpenseDonut data={data.expenseCategories} />
          ) : (
            <EmptyState message="No expenses recorded yet." />
          )}
        </Panel>
        <Panel title="Recent Activity">
          {data.recent.length ? (
            <RecentActivity items={data.recent} />
          ) : (
            <EmptyState message="Nothing here yet." />
          )}
        </Panel>
      </div>
    </>
  );
}
