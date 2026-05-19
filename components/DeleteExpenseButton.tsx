"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
          className="font-semibold text-expense hover:underline"
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-muted-2 hover:text-text"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-xs text-muted-2 transition-colors hover:text-expense"
      aria-label="Delete expense"
    >
      <Trash2 size={13} />
    </button>
  );
}
