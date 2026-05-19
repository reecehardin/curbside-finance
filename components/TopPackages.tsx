import { formatMoney } from "@/lib/format";
import type { RankedItem } from "@/lib/queries";

export default function TopPackages({ items }: { items: RankedItem[] }) {
  const max = items.reduce((m, i) => Math.max(m, i.amount), 0);

  return (
    <ul className="space-y-3.5">
      {items.map((item, i) => (
        <li key={item.name}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="flex items-center gap-2 truncate pr-2">
              <span className="font-display text-xs font-bold text-muted-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="truncate text-text">{item.name}</span>
            </span>
            <span className="font-display font-semibold text-income">
              {formatMoney(item.amount)}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-income/60 to-income"
              style={{ width: `${max > 0 ? (item.amount / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
