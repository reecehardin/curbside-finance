type Tone = "income" | "expense" | "profit";

const TONES: Record<Tone, { wrap: string; value: string; label: string }> = {
  income: {
    wrap: "border-accent/40 bg-gradient-to-br from-accent/10 to-transparent",
    value: "text-income",
    label: "text-muted-2",
  },
  expense: {
    wrap: "border-expense/40 bg-gradient-to-br from-expense/10 to-transparent",
    value: "text-expense",
    label: "text-expense/70",
  },
  profit: {
    wrap: "border-border bg-surface",
    value: "text-text",
    label: "text-muted-2",
  },
};

export default function SummaryCard({
  tone,
  label,
  value,
  hint,
}: {
  tone: Tone;
  label: string;
  value: string;
  hint?: string;
}) {
  const t = TONES[tone];
  return (
    <div className={`rounded-card border p-5 ${t.wrap}`}>
      <div className={`text-xs uppercase tracking-wide ${t.label}`}>
        {label}
      </div>
      <div className={`mt-2 text-3xl font-extrabold ${t.value}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
