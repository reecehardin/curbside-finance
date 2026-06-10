import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { advanceBillingDate, billingMonthOf, todayUTC } from "@/lib/recurring";
import type { RecurringExpense } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Posts every due recurring expense as a transaction, then advances its
 * next_billing_date. Hit daily by Vercel Cron (vercel.json), which sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically.
 *
 * Idempotent: the unique (recurring_expense_id, billing_month) index makes a
 * duplicate insert a 23505, which we treat as already-posted. A subscription
 * that fell several months behind catches up one month per loop iteration.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayUTC();

  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("active", true)
    .lte("next_billing_date", today);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let posted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const sub of (data ?? []) as RecurringExpense[]) {
    let next = sub.next_billing_date;

    while (next <= today) {
      const { error: insertError } = await supabase.from("transactions").insert({
        type: "expense",
        amount: sub.amount,
        description: sub.name,
        category: sub.category,
        occurred_at: `${next}T12:00:00Z`,
        source: "recurring",
        status: "completed",
        recurring_expense_id: sub.id,
        billing_month: billingMonthOf(next),
      });

      if (insertError && insertError.code !== "23505") {
        errors.push(`${sub.name}: ${insertError.message}`);
        break; // don't advance past a real failure; retry next run
      }
      if (insertError) skipped++;
      else posted++;

      next = advanceBillingDate(next, sub.billing_day);
    }

    if (next !== sub.next_billing_date) {
      const { error: updateError } = await supabase
        .from("recurring_expenses")
        .update({ next_billing_date: next })
        .eq("id", sub.id);
      if (updateError) errors.push(`${sub.name}: ${updateError.message}`);
    }
  }

  return NextResponse.json({ posted, skipped, errors });
}
