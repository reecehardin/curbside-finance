"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addExpense } from "@/lib/actions";
import { EXPENSE_CATEGORIES } from "@/lib/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddExpenseModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await addExpense(formData);
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
      <button onClick={() => setOpen(true)} className="btn-accent">
        + Add Expense
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Add Expense</h2>
            <p className="mt-0.5 text-sm text-muted">
              Record something you paid for.
            </p>

            <form action={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="label">Description</label>
                <input
                  name="description"
                  required
                  autoFocus
                  placeholder="e.g. Monthly server hosting"
                  className="input mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    name="occurred_at"
                    type="date"
                    defaultValue={today()}
                    className="input mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  name="category"
                  defaultValue={EXPENSE_CATEGORIES[0]}
                  className="input mt-1"
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
                  className="rounded-lg px-4 py-2 text-sm text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-accent">
                  {pending ? "Saving…" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
