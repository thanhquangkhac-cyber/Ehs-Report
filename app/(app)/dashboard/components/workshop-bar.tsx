"use client";

import "./chart-setup";
import { Bar } from "react-chartjs-2";

export function WorkshopBar({ data }: { data: { xuong: string; total: number }[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">Bao cao theo xuong</p>
      <div style={{ height: 260 }}>
        <Bar
          data={{
            labels: data.map((d) => d.xuong),
            datasets: [
              {
                data: data.map((d) => d.total),
                backgroundColor: "#1A3A63",
                borderRadius: 4,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, ticks: { stepSize: 1 } },
            },
          }}
        />
      </div>
    </div>
  );
}
