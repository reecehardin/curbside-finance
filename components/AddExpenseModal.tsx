"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
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
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus size={16} />
        Add Expense
      </button>

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
                <h2 className="heading text-lg text-text">Add Expense</h2>
                <p className="mt-0.5 text-sm text-muted">
                  Record something you paid for.
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
                <label className="label">Description</label>
                <input
                  name="description"
                  required
                  autoFocus
                  placeholder="e.g. Monthly server hosting"
                  className="input mt-1.5"
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
                    className="input mt-1.5"
                  />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    name="occurred_at"
                    type="date"
                    defaultValue={today()}
                    className="input mt-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  name="category"
                  defaultValue={EXPENSE_CATEGORIES[0]}
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
