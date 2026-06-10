export type TransactionType = "income" | "expense";
export type TransactionSource = "tebex" | "manual" | "recurring";
export type TransactionStatus = "completed" | "refunded";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  category: string | null;
  customer_name: string | null;
  occurred_at: string;
  source: TransactionSource;
  status: TransactionStatus;
  tebex_transaction_id: string | null;
  recurring_expense_id: string | null;
  /** First day of the charge's month — set only on recurring charges. */
  billing_month: string | null;
  raw_payload: unknown;
  created_at: string;
}

/** Suggested expense categories offered in the Add Expense form. */
export const EXPENSE_CATEGORIES = [
  "Server Hosting",
  "Assets & Scripts",
  "Staff & Payroll",
  "Advertising",
  "Software & Tools",
  "Other",
] as const;

/** A subscription that bills every month on `billing_day`. */
export interface RecurringExpense {
  id: string;
  name: string;
  /** USD amount posted each month. */
  amount: number;
  /** Original price when the sub bills in another currency (e.g. 20 EUR). */
  original_amount: number | null;
  original_currency: string | null;
  category: string | null;
  /** Day of month it bills, 1–31 (clamped in short months). */
  billing_day: number;
  /** Next date a charge should post, YYYY-MM-DD. */
  next_billing_date: string;
  active: boolean;
  created_at: string;
}
