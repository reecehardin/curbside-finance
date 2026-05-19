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
        <CartesianGrid stroke="#1d2722" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#7e8a82", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1d2722" }}
        />
        <YAxis
          tick={{ fill: "#7e8a82", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatMoneyCompact(Number(v))}
          width={56}
        />
        <Tooltip
          cursor={{ fill: "#ffffff08" }}
          contentStyle={{
            background: "#101512",
            border: "1px solid #1d2722",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#e8efe9" }}
          formatter={(value: number, name) => [
            formatMoney(value),
            name === "income" ? "Income" : "Expenses",
          ]}
        />
        <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={34} />
        <Bar dataKey="expenses" fill="#e08a4a" radius={[3, 3, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}
