import { formatMoney } from "@/lib/format";
import type { RankedItem } from "@/lib/queries";

export default function TopPackages({ items }: { items: RankedItem[] }) {
  const max = items.reduce((m, i) => Math.max(m, i.amount), 0);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name}>
          <div className="flex justify-between text-sm">
            <span className="truncate pr-2">{item.name}</span>
            <span className="font-medium text-income">
              {formatMoney(item.amount)}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-border">
            <div
              className="h-1.5 rounded-full bg-accent"
              style={{ width: `${max > 0 ? (item.amount / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
