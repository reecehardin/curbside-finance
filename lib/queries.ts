import { createClient } from "@/lib/supabase/server";
import type { Period } from "@/lib/period";
import type { Transaction } from "@/lib/types";

export interface Totals {
  income: number;
  expenses: number;
  profit: number;
  margin: number; // profit / income, 0..1
  incomeCount: number;
  expenseCount: number;
}

export interface ChartPoint {
  label: string;
  income: number;
  expenses: number;
}

export interface RankedItem {
  name: string;
  amount: number;
}

export interface DashboardData {
  totals: Totals;
  series: ChartPoint[];
  topPackages: RankedItem[];
  expenseCategories: RankedItem[];
  recent: Transaction[];
}

/** Fetches every transaction within a period, newest first. */
export async function getTransactions(
  period: Period,
  opts: { type?: "income" | "expense" } = {},
): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("occurred_at", { ascending: false });

  if (!period.isAll) {
    query = query.gte("occurred_at", period.start!).lt("occurred_at", period.end!);
  }
  if (opts.type) {
    query = query.eq("type", opts.type);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load transactions: ${error.message}`);
  return (data ?? []) as Transaction[];
}

/** Aggregates a period's transactions into everything the dashboard renders. */
export async function getDashboardData(period: Period): Promise<DashboardData> {
  const all = await getTransactions(period);
  // Refunded transactions are excluded from every analytic.
  const live = all.filter((t) => t.status === "completed");

  const income = live.filter((t) => t.type === "income");
  const expenses = live.filter((t) => t.type === "expense");

  const incomeTotal = sum(income);
  const expenseTotal = sum(expenses);

  const totals: Totals = {
    income: incomeTotal,
    expenses: expenseTotal,
    profit: incomeTotal - expenseTotal,
    margin: incomeTotal > 0 ? (incomeTotal - expenseTotal) / incomeTotal : 0,
    incomeCount: income.length,
    expenseCount: expenses.length,
  };

  return {
    totals,
    series: buildSeries(live, period),
    topPackages: rank(income, (t) => t.description, 5),
    expenseCategories: rank(expenses, (t) => t.category || "Uncategorized", 6),
    recent: all.slice(0, 8),
  };
}

function sum(rows: Transaction[]): number {
  return rows.reduce((acc, t) => acc + Number(t.amount), 0);
}

/** Groups income/expense totals into time buckets for the bar chart. */
function buildSeries(rows: Transaction[], period: Period): ChartPoint[] {
  const buckets = new Map<string, ChartPoint>();
  const order: string[] = [];

  const ensure = (key: string, label: string) => {
    if (!buckets.has(key)) {
      buckets.set(key, { label, income: 0, expenses: 0 });
      order.push(key);
    }
    return buckets.get(key)!;
  };

  if (period.isAll) {
    // One bucket per calendar month.
    for (const t of rows) {
      const d = new Date(t.occurred_at);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      });
      add(ensure(key, label), t);
    }
    order.sort();
  } else {
    // One bucket per day of the selected month.
    const start = new Date(period.start!);
    const days = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
    ).getUTCDate();
    for (let day = 1; day <= days; day++) {
      ensure(String(day), String(day));
    }
    for (const t of rows) {
      const day = new Date(t.occurred_at).getUTCDate();
      add(ensure(String(day), String(day)), t);
    }
  }

  return order.map((k) => buckets.get(k)!);
}

function add(point: ChartPoint, t: Transaction) {
  if (t.type === "income") point.income += Number(t.amount);
  else point.expenses += Number(t.amount);
}

/** Sums transactions by a key and returns the biggest `limit` groups. */
function rank(
  rows: Transaction[],
  keyOf: (t: Transaction) => string,
  limit: number,
): RankedItem[] {
  const totals = new Map<string, number>();
  for (const t of rows) {
    const k = keyOf(t);
    totals.set(k, (totals.get(k) ?? 0) + Number(t.amount));
  }
  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}
