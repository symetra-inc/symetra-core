"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PixData {
  date: string; // ISO yyyy-mm-dd
  count: number;
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function fmtBR(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function PixChart({ data }: { data: PixData[] }) {
  const map = new Map(data.map((d) => [d.date, d.count]));
  const chartData = getLast7Days().map((date) => ({
    label: fmtBR(date),
    count: map.get(date) ?? 0,
  }));

  const max = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white">Pix confirmados</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Últimos 7 dias</p>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} barSize={26} barCategoryGap="30%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
          />
          <YAxis hide domain={[0, max + 1]} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 12,
              color: "#fff",
            }}
            formatter={(v) => [v ?? 0, "confirmados"]}
            labelStyle={{ color: "#71717a", marginBottom: 2 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.count > 0
                    ? "rgb(16,185,129)"
                    : "rgba(255,255,255,0.05)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
