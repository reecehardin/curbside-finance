"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/format";
import type { RankedItem } from "@/lib/queries";

const COLORS = ["#ff3d7f", "#22d3ee", "#a06bff", "#2fe88f", "#3d8bff", "#f5b73d"];

export default function ExpenseDonut({ data }: { data: RankedItem[] }) {
  const total = data.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            innerRadius={42}
            outerRadius={66}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#0d0f1a",
              border: "1px solid #2f3556",
              borderRadius: 10,
              fontSize: 12,
            }}
            formatter={(value: number) => formatMoney(value)}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="flex-1 truncate text-muted">{d.name}</span>
            <span className="font-display font-medium text-text">
              {formatMoney(d.amount)}
            </span>
            <span className="w-10 text-right text-xs text-muted-2">
              {total > 0 ? Math.round((d.amount / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
