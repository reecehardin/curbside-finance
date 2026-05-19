import { ArrowDownLeft, ArrowUpRight, Wallet, type LucideIcon } from "lucide-react";

type Tone = "income" | "expense" | "profit";

const TONES: Record<
  Tone,
  { icon: LucideIcon; value: string; chip: string; glow: string; shadow: string }
> = {
  income: {
    icon: ArrowDownLeft,
    value: "text-income",
    chip: "bg-income/12 text-income",
    glow: "bg-income/15",
    shadow: "drop-shadow-[0_0_14px_rgba(47,232,143,0.45)]",
  },
  expense: {
    icon: ArrowUpRight,
    value: "text-expense",
    chip: "bg-expense/12 text-expense",
    glow: "bg-expense/15",
    shadow: "drop-shadow-[0_0_14px_rgba(255,61,127,0.4)]",
  },
  profit: {
    icon: Wallet,
    value: "text-primary-bright",
    chip: "bg-primary/12 text-primary-bright",
    glow: "bg-primary/15",
    shadow: "drop-shadow-[0_0_14px_rgba(61,139,255,0.45)]",
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
  const Icon = t.icon;

  return (
    <div className="card relative overflow-hidden p-5">
      {/* corner glow */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${t.glow}`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="label">{label}</span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.chip}`}
          >
            <Icon size={16} />
          </span>
        </div>
        <div
          className={`mt-3 font-display text-4xl font-bold tracking-tight ${t.value} ${t.shadow}`}
        >
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
      </div>
    </div>
  );
}
