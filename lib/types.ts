export type TransactionType = "income" | "expense";
export type TransactionSource = "tebex" | "manual";
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
