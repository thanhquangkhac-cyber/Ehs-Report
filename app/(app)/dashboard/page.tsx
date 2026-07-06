"use client";

import { useEffect, useState, useCallback } from "react";
import { StatCards } from "./components/stat-cards";
import { StatusDoughnut } from "./components/status-doughnut";
import { WorkshopBar } from "./components/workshop-bar";
import { FixRateChart } from "./components/fix-rate-chart";
import { ParetoChart } from "./components/pareto-chart";
import { Leaderboard } from "./components/leaderboard";
import { GembaMiniStats } from "./components/gemba-mini-stats";

type Stats = {
  statCards: { total: number; pending: number; fixed: number; overdue: number };
  statusBreakdown: { pending: number; approved: number; fixed: number; rejected: number };
  byWorkshop: { xuong: string; total: number; pending: number; fixed: number; overdue: number; fixRate: number }[];
  pareto: {
    category: { label: string; count: number }[];
    goldenRule: { label: string; count: number }[];
    severity: { label: string; count: number }[];
    area: { label: string; count: number }[];
  };
  leaderboard: { hoTen: string; boPhan: string | null; count: number }[];
  gembaStats: {
    total: number;
    uniqueInspectors: number;
    incidents: number;
    byWorkshop: { xuong: string; count: number }[];
  };
};

type TimeFilter = "all" | "month" | "week";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const load = useCallback(async () => {
    const sp = new URLSearchParams({ filter });
    if (filter === "month") {
      sp.set("year", year);
      sp.set("month", month);
    }
    const res = await fetch(`/api/dashboard/stats?${sp.toString()}`);
    if (res.ok) setStats(await res.json());
  }, [filter, year, month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState only runs after the awaited fetch resolves, not synchronously in the effect body
    void load();
  }, [load]);

  if (!stats) return <p className="text-sm text-slate-400">Dang tai...</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex gap-2">
          {(["all", "month"] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                filter === f ? "bg-orange-500 text-white" : "border border-slate-300 bg-white text-slate-600"
              }`}
            >
              {f === "all" ? "Tat ca" : "Theo thang"}
            </button>
          ))}
          {filter === "month" && (
            <>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
              />
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Thang {m}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <StatCards {...stats.statCards} />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusDoughnut {...stats.statusBreakdown} />
        <WorkshopBar data={stats.byWorkshop} />
      </div>

      <div className="mb-6">
        <FixRateChart data={stats.byWorkshop} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ParetoChart title="Phan loai" data={stats.pareto.category} />
        <ParetoChart title="Golden Rule" data={stats.pareto.goldenRule} />
        <ParetoChart title="Muc do" data={stats.pareto.severity} />
        <ParetoChart title="Khu vuc" data={stats.pareto.area} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Leaderboard data={stats.leaderboard} />
        <GembaMiniStats {...stats.gembaStats} />
      </div>
    </div>
  );
}
