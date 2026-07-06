"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Report = {
  id: number;
  hoTen: string;
  boPhan: string | null;
  xuong: string;
  viTri: string;
  noiDung: string;
  status: "pending" | "approved" | "rejected" | "fixed";
  isOverdue: boolean;
  deadline: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<Report["status"], { label: string; cls: string }> = {
  pending: { label: "Cho duyet", cls: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Da duyet", cls: "bg-blue-100 text-blue-800" },
  rejected: { label: "Tu choi", cls: "bg-red-100 text-red-800" },
  fixed: { label: "Da KP", cls: "bg-green-100 text-green-800" },
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) setReports(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = reports.filter((r) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "overdue") return r.isOverdue;
    return r.status === statusFilter;
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Bao cao an toan ({reports.length})</h1>
        <div className="flex gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/reports/export"
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Xuat CSV
          </a>
          <button
            onClick={() => router.push("/reports/new")}
            className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + Bao cao moi
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {["all", "pending", "approved", "fixed", "rejected", "overdue"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded px-3 py-1 text-xs font-medium ${
              statusFilter === s ? "bg-orange-500 text-white" : "bg-white text-slate-600 border border-slate-300"
            }`}
          >
            {s === "all"
              ? "Tat ca"
              : s === "overdue"
                ? "Qua han"
                : STATUS_LABEL[s as Report["status"]].label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-slate-400">Dang tai...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">Khong co bao cao</p>
        ) : (
          filtered.map((r) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="block rounded border border-slate-200 bg-white p-3 hover:border-orange-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-400">#{r.id}</span>{" "}
                  <span className="font-semibold text-slate-800">{r.hoTen}</span>{" "}
                  <span className="text-xs text-slate-500">
                    - {r.boPhan || "-"} - {r.xuong}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {r.isOverdue && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Qua han
                    </span>
                  )}
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_LABEL[r.status].cls}`}
                  >
                    {STATUS_LABEL[r.status].label}
                  </span>
                </div>
              </div>
              <p className="mt-1 truncate text-sm text-slate-600">{r.noiDung}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
