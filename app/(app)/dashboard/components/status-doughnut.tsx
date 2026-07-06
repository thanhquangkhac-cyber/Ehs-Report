"use client";

import "./chart-setup";
import { Doughnut } from "react-chartjs-2";

const COLORS = {
  pending: "#f37021",
  approved: "#1a3a63",
  fixed: "#16a34a",
  rejected: "#dc2626",
};

export function StatusDoughnut({
  pending,
  approved,
  fixed,
  rejected,
}: {
  pending: number;
  approved: number;
  fixed: number;
  rejected: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">Trang thai bao cao</p>
      <div className="mx-auto max-w-[260px]">
        <Doughnut
          data={{
            labels: ["Cho duyet", "Da duyet", "Da KP", "Tu choi"],
            datasets: [
              {
                data: [pending, approved, fixed, rejected],
                backgroundColor: [
                  COLORS.pending,
                  COLORS.approved,
                  COLORS.fixed,
                  COLORS.rejected,
                ],
                borderWidth: 2,
                borderColor: "#fff",
              },
            ],
          }}
          options={{
            plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } },
          }}
        />
      </div>
    </div>
  );
}
