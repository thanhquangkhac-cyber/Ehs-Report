"use client";

import "./chart-setup";
import { Bar } from "react-chartjs-2";

const PALETTE = [
  "#1A3A63",
  "#4A6D95",
  "#F37021",
  "#16a34a",
  "#d97706",
  "#2563eb",
  "#0d9488",
  "#7c3aed",
  "#dc2626",
  "#64748b",
];

export function ParetoChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; count: number }[];
}) {
  const top = data.slice(0, 10);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      <div style={{ height: 220 }}>
        <Bar
          data={{
            labels: top.map((d) => d.label),
            datasets: [
              {
                data: top.map((d) => d.count),
                backgroundColor: top.map((_, i) => PALETTE[i % PALETTE.length]),
                borderRadius: 4,
              },
            ],
          }}
          options={{
            indexAxis: "y" as const,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, ticks: { stepSize: 1 } },
              y: { grid: { display: false } },
            },
          }}
        />
      </div>
    </div>
  );
}
