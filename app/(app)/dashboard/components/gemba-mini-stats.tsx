"use client";

import "./chart-setup";
import { Bar } from "react-chartjs-2";

export function GembaMiniStats({
  total,
  uniqueInspectors,
  incidents,
  byWorkshop,
}: {
  total: number;
  uniqueInspectors: number;
  incidents: number;
  byWorkshop: { xuong: string; count: number }[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">Gemba walk</p>
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-slate-800">{total}</p>
          <p className="text-xs text-slate-500">Luot kiem tra</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{uniqueInspectors}</p>
          <p className="text-xs text-slate-500">Nguoi kiem tra</p>
        </div>
        <div>
          <p className="text-lg font-bold text-red-600">{incidents}</p>
          <p className="text-xs text-slate-500">Su co phat hien</p>
        </div>
      </div>
      <div style={{ height: 180 }}>
        <Bar
          data={{
            labels: byWorkshop.map((d) => d.xuong),
            datasets: [
              { data: byWorkshop.map((d) => d.count), backgroundColor: "#4A6D95", borderRadius: 4 },
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
