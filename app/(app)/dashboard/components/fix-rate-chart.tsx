"use client";

import "./chart-setup";
import { Chart } from "react-chartjs-2";

export function FixRateChart({
  data,
}: {
  data: { xuong: string; fixRate: number }[];
}) {
  const colors = data.map((d) => (d.fixRate >= 90 ? "#16a34a" : "#dc2626"));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">
        Ty le khac phuc theo xuong (target 90%)
      </p>
      <div style={{ height: 260 }}>
        <Chart
          type="bar"
          data={{
            labels: data.map((d) => d.xuong),
            datasets: [
              {
                type: "bar" as const,
                label: "Ty le KP (%)",
                data: data.map((d) => d.fixRate),
                backgroundColor: colors,
                borderRadius: 4,
              },
              {
                type: "line" as const,
                label: "Target 90%",
                data: data.map(() => 90),
                borderColor: "#d97706",
                borderWidth: 2,
                borderDash: [6, 4],
                pointRadius: 0,
                fill: false,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, max: 110, ticks: { callback: (v) => `${v}%` } },
            },
          }}
        />
      </div>
    </div>
  );
}
