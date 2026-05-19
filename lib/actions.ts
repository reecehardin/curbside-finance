"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Records a manual expense from the Add Expense form. */
export async function addExpense(formData: FormData): Promise<ActionResult> {
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const dateRaw = String(formData.get("occurred_at") ?? "").trim();

  if (!description) return { ok: false, error: "Description is required." };

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter an amount greater than 0." };
  }

  // A date input gives "YYYY-MM-DD"; anchor it to noon UTC to avoid drift.
  const occurredAt = dateRaw
    ? new Date(`${dateRaw}T12:00:00Z`).toISOString()
    : new Date().toISOString();

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    type: "expense",
    amount,
    description,
    category: category || null,
    occurred_at: occurredAt,
    source: "manual",
    status: "completed",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/expenses");
  return { ok: true };
}

/** Deletes a transaction (used to remove a mistaken manual expense). */
export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/income");
  return { ok: true };
}
