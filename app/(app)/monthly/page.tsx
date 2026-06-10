import PageHeader from "@/components/PageHeader";
import RecurringModal from "@/components/RecurringModal";
import RecurringTable from "@/components/RecurringTable";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import type { RecurringExpense } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MonthlyPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .order("billing_day", { ascending: true });
  if (error) throw new Error(`Failed to load subscriptions: ${error.message}`);

  const subs = (data ?? []) as RecurringExpense[];
  const active = subs.filter((s) => s.active);
  const monthlyTotal = active.reduce((acc, s) => acc + Number(s.amount), 0);

  return (
    <>
      <PageHeader
        title="Monthly Expenses"
        subtitle={`${formatMoney(monthlyTotal)}/month across ${active.length} active subscription${active.length === 1 ? "" : "s"}`}
      >
        <RecurringModal />
      </PageHeader>

      {subs.length ? (
        <RecurringTable rows={subs} />
      ) : (
        <EmptyState message='No subscriptions yet. Use “Add Subscription” to track one.' />
      )}
    </>
  );
}
