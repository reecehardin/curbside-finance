"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import type { ChartPoint } from "@/lib/queries";

export default function IncomeExpenseChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="#1f2336" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#5f6488", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1f2336" }}
        />
        <YAxis
          tick={{ fill: "#5f6488", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatMoneyCompact(Number(v))}
          width={56}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "#0d0f1a",
            border: "1px solid #2f3556",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "#eef0fa" }}
          formatter={(value: number, name) => [
            formatMoney(value),
            name === "income" ? "Income" : "Expenses",
          ]}
        />
        <Bar dataKey="income" fill="#2fe88f" radius={[3, 3, 0, 0]} maxBarSize={32} />
        <Bar dataKey="expenses" fill="#ff3d7f" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
