"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { addRecurring, updateRecurring } from "@/lib/recurring-actions";
import { EXPENSE_CATEGORIES, type RecurringExpense } from "@/lib/types";

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

/**
 * Add (no `initial`) or Edit (`initial` set) a recurring subscription.
 */
export default function RecurringModal({
  initial,
}: {
  initial?: RecurringExpense;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(
    initial?.original_currency ?? "USD",
  );

  const isEdit = !!initial;

  function openModal() {
    setError(null);
    setCurrency(initial?.original_currency ?? "USD");
    setOpen(true);
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = isEdit
      ? await updateRecurring(initial.id, formData)
      : await addRecurring(formData);
    setPending(false);

    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <>
      {isEdit ? (
        <button
          onClick={openModal}
          className="text-muted-2 transition-colors hover:text-text"
          aria-label={`Edit ${initial.name}`}
        >
          <Pencil size={15} />
        </button>
      ) : (
        <button onClick={openModal} className="btn-primary">
          <Plus size={16} />
          Add Subscription
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 p-4 backdrop-blur-sm"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="card w-full max-w-md animate-fade-up p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="heading text-lg text-text">
                  {isEdit ? "Edit Subscription" : "Add Subscription"}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Billed automatically every month on its billing day.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-2 transition-colors hover:text-text"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form action={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  name="name"
                  required
                  autoFocus
                  defaultValue={initial?.name}
                  placeholder="e.g. JG+ Subscription"
                  className="input mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (USD)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={initial?.amount}
                    placeholder="0.00"
                    className="input mt-1.5"
                  />
                </div>
                <div>
                  <label className="label">Bills on day</label>
                  <input
                    name="billing_day"
                    type="number"
                    min="1"
                    max="31"
                    required
                    defaultValue={initial?.billing_day}
                    placeholder="1–31"
                    className="input mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Billed currency</label>
                  <select
                    name="original_currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input mt-1.5 cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    {currency === "USD" ? "—" : `Price in ${currency}`}
                  </label>
                  <input
                    name="original_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    disabled={currency === "USD"}
                    defaultValue={initial?.original_amount ?? undefined}
                    placeholder={currency === "USD" ? "n/a" : "0.00"}
                    className="input mt-1.5 disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  name="category"
                  defaultValue={initial?.category ?? EXPENSE_CATEGORIES[0]}
                  className="input mt-1.5 cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-lg border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
