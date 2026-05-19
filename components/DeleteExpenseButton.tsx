"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTransaction } from "@/lib/actions";

export default function DeleteExpenseButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function remove() {
    startTransition(async () => {
      await deleteTransaction(id);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <span className="flex items-center justify-end gap-2 text-xs">
        <button
          onClick={remove}
          disabled={pending}
          className="text-expense hover:underline"
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-muted hover:underline"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-muted hover:text-expense"
      aria-label="Delete expense"
    >
      Delete
    </button>
  );
}
