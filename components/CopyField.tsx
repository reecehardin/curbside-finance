"use client";

import { useState } from "react";

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — user can select the text manually */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg border border-border bg-bg px-3 py-2 text-sm">
        {value}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
