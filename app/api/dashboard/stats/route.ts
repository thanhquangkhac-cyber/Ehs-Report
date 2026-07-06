import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { computeOverdue } from "@/lib/report-status";

const { baoCao, gemba } = schema;

function getIsoWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

type TimeFilter = "all" | "month" | "week";

function matchesTimeFilter(
  createdAt: string,
  filter: TimeFilter,
  year: string,
  month: string,
  week: string
): boolean {
  if (filter === "all") return true;
  const d = new Date(createdAt);
  if (filter === "month") {
    if (year && d.getFullYear().toString() !== year) return false;
    if (month && (d.getMonth() + 1).toString() !== month) return false;
    return true;
  }
  // week
  const iso = getIsoWeek(d);
  if (year && iso.year.toString() !== year) return false;
  if (week && iso.week.toString() !== week) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const filter = (sp.get("filter") as TimeFilter) || "all";
  const year = sp.get("year") || "";
  const month = sp.get("month") || "";
  const week = sp.get("week") || "";
  const workshops = sp.getAll("xuong"); // multi-select workshop filter

  const allReports: (typeof baoCao.$inferSelect)[] = await db.select().from(baoCao);
  const allGemba: (typeof gemba.$inferSelect)[] = await db.select().from(gemba);

  const filteredReports = allReports.filter((r) => {
    if (workshops.length && !workshops.includes(r.xuong)) return false;
    return matchesTimeFilter(r.createdAt as unknown as string, filter, year, month, week);
  });

  const withOverdue = filteredReports.map((r) => ({
    ...r,
    ...computeOverdue({ status: r.status, deadline: r.deadline }),
  }));

  // --- Stat cards ---
  const statCards = {
    total: withOverdue.length,
    pending: withOverdue.filter((r) => r.status === "pending").length,
    fixed: withOverdue.filter((r) => r.status === "fixed").length,
    overdue: withOverdue.filter((r) => r.isOverdue).length,
  };

  // --- Status doughnut ---
  const statusBreakdown = {
    pending: withOverdue.filter((r) => r.status === "pending").length,
    approved: withOverdue.filter((r) => r.status === "approved").length,
    fixed: withOverdue.filter((r) => r.status === "fixed").length,
    rejected: withOverdue.filter((r) => r.status === "rejected").length,
  };

  // --- Per-workshop breakdown (bar + fix-rate) ---
  const wsMap = new Map<
    string,
    { total: number; pending: number; fixed: number; overdue: number }
  >();
  for (const r of withOverdue) {
    const key = r.xuong || "Khac";
    if (!wsMap.has(key)) wsMap.set(key, { total: 0, pending: 0, fixed: 0, overdue: 0 });
    const bucket = wsMap.get(key)!;
    bucket.total++;
    if (r.status === "pending" || r.status === "approved") bucket.pending++;
    if (r.status === "fixed") bucket.fixed++;
    if (r.isOverdue) bucket.overdue++;
  }
  const byWorkshop = Array.from(wsMap.entries())
    .map(([xuong, v]) => ({
      xuong,
      ...v,
      fixRate: v.total ? Math.round((v.fixed / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // --- Pareto breakdowns ---
  function paretoBy(field: "category" | "goldenRule" | "severity" | "area") {
    const map = new Map<string, number>();
    for (const r of withOverdue) {
      const v = (r[field] as string) || "Khac";
      map.set(v, (map.get(v) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  // --- Top reporting employees leaderboard ---
  const empMap = new Map<string, { hoTen: string; boPhan: string | null; count: number }>();
  for (const r of withOverdue) {
    const key = r.maNv || r.hoTen;
    if (!empMap.has(key)) empMap.set(key, { hoTen: r.hoTen, boPhan: r.boPhan, count: 0 });
    empMap.get(key)!.count++;
  }
  const leaderboard = Array.from(empMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // --- Gemba mini-stats ---
  const filteredGemba = allGemba.filter((g) => {
    if (workshops.length && !workshops.includes(g.xuong)) return false;
    return matchesTimeFilter(g.createdAt as unknown as string, filter, year, month, week);
  });
  const gembaByWorkshop = new Map<string, number>();
  for (const g of filteredGemba) {
    const key = g.xuong || "Khac";
    gembaByWorkshop.set(key, (gembaByWorkshop.get(key) || 0) + 1);
  }
  const gembaStats = {
    total: filteredGemba.length,
    uniqueInspectors: new Set(filteredGemba.map((g) => g.maNv)).size,
    incidents: filteredGemba.filter((g) => g.coSuCo).length,
    byWorkshop: Array.from(gembaByWorkshop.entries())
      .map(([xuong, count]) => ({ xuong, count }))
      .sort((a, b) => b.count - a.count),
  };

  return NextResponse.json({
    statCards,
    statusBreakdown,
    byWorkshop,
    pareto: {
      category: paretoBy("category"),
      goldenRule: paretoBy("goldenRule"),
      severity: paretoBy("severity"),
      area: paretoBy("area"),
    },
    leaderboard,
    gembaStats,
  });
}
