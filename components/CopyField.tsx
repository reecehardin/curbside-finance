"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

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
      <code className="flex-1 truncate rounded-lg border border-border bg-bg-deep px-3 py-2 text-sm text-primary-bright">
        {value}
      </code>
      <button
        onClick={copy}
        className="btn-ghost shrink-0 px-3 py-2"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <>
            <Check size={14} className="text-income" /> Copied
          </>
        ) : (
          <>
            <Copy size={14} /> Copy
          </>
        )}
      </button>
    </div>
  );
}
