"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nextOccurrence, todayUTC } from "@/lib/recurring";
import type { ActionResult } from "@/lib/actions";

interface RecurringInput {
  name: string;
  amount: number;
  original_amount: number | null;
  original_currency: string | null;
  category: string | null;
  billing_day: number;
}

/** Parses + validates the shared Add/Edit form fields. */
function parseForm(formData: FormData): RecurringInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const amount = Number(String(formData.get("amount") ?? "").trim());
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a USD amount greater than 0." };
  }

  const billingDay = Number(String(formData.get("billing_day") ?? "").trim());
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) {
    return { error: "Billing day must be between 1 and 31." };
  }

  const originalRaw = String(formData.get("original_amount") ?? "").trim();
  const originalCurrency = String(formData.get("original_currency") ?? "").trim();
  let original_amount: number | null = null;
  let original_currency: string | null = null;
  if (originalRaw && originalCurrency && originalCurrency !== "USD") {
    const parsed = Number(originalRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { error: "Original amount must be greater than 0." };
    }
    original_amount = parsed;
    original_currency = originalCurrency;
  }

  const category = String(formData.get("category") ?? "").trim();

  return {
    name,
    amount,
    original_amount,
    original_currency,
    category: category || null,
    billing_day: billingDay,
  };
}

/** Creates a subscription; first charge posts on its next billing-day occurrence. */
export async function addRecurring(formData: FormData): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("recurring_expenses").insert({
    ...parsed,
    next_billing_date: nextOccurrence(parsed.billing_day, todayUTC()),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly");
  return { ok: true };
}

/** Edits a subscription; recomputes the next charge date only if the day changed. */
export async function updateRecurring(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("recurring_expenses")
    .select("billing_day")
    .eq("id", id)
    .single();
  if (fetchError) return { ok: false, error: fetchError.message };

  const update: Record<string, unknown> = { ...parsed };
  if (existing.billing_day !== parsed.billing_day) {
    update.next_billing_date = nextOccurrence(parsed.billing_day, todayUTC());
  }

  const { error } = await supabase
    .from("recurring_expenses")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly");
  return { ok: true };
}

/** Pauses or resumes a subscription. Paused subs never post. */
export async function toggleRecurring(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const update: Record<string, unknown> = { active };
  // On resume, skip any periods missed while paused instead of back-billing.
  if (active) {
    const { data: existing, error: fetchError } = await supabase
      .from("recurring_expenses")
      .select("billing_day")
      .eq("id", id)
      .single();
    if (fetchError) return { ok: false, error: fetchError.message };
    update.next_billing_date = nextOccurrence(existing.billing_day, todayUTC());
  }

  const { error } = await supabase
    .from("recurring_expenses")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly");
  return { ok: true };
}

/** Deletes a subscription. Past posted expenses are kept (FK set-null). */
export async function deleteRecurring(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly");
  return { ok: true };
}
