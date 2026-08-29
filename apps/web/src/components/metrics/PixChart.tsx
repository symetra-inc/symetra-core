"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PixData {
  date: string;
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
    <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] p-5 h-full">
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-[22px] h-[0.5px] bg-[rgba(197,160,89,0.5)]" />
          <span className="font-data text-[9px] text-[rgba(197,160,89,0.65)] tracking-[0.2em] uppercase">
            Pix Confirmados
          </span>
        </div>
        <p className="font-ui text-[11px] text-ash">Últimos 7 dias</p>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={chartData} barSize={22} barCategoryGap="35%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9C8E82", fontSize: 10, fontFamily: "var(--font-jetbrains, monospace)" }}
          />
          <YAxis hide domain={[0, max + 1]} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(197,160,89,0.04)" }}
            contentStyle={{
              background: "#1A1714",
              border: "0.5px solid rgba(156,142,130,0.18)",
              borderRadius: 6,
              fontSize: 11,
              color: "#F5F0E8",
              fontFamily: "var(--font-jetbrains, monospace)",
            }}
            formatter={(v) => [v ?? 0, "confirmados"]}
            labelStyle={{ color: "#9C8E82", marginBottom: 2 }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count > 0 ? "#C5A059" : "rgba(156,142,130,0.10)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
