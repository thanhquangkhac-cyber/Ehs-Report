"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Report = {
  id: number;
  maNv: string;
  hoTen: string;
  boPhan: string | null;
  xuong: string;
  viTri: string;
  noiDung: string;
  hinhAnh: string | null;
  status: "pending" | "approved" | "rejected" | "fixed";
  category: string | null;
  goldenRule: string | null;
  severity: string | null;
  area: string | null;
  nguoiKp: string | null;
  deadline: string | null;
  isOverdue: boolean;
  daysRemaining: number | null;
  fixer: string | null;
  fixNote: string | null;
  fixImg: string | null;
  createdAt: string;
};

type Me = { role: "admin" | "quanly" | "nhanvien" };

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [approveForm, setApproveForm] = useState({
    category: "",
    goldenRule: "",
    severity: "medium",
    area: "",
    nguoiKp: "",
    nkpEmail: "",
    deadline: "",
  });
  const [fixLink, setFixLink] = useState("");

  const load = useCallback(async () => {
    const [reportRes, meRes] = await Promise.all([
      fetch(`/api/reports/${params.id}`),
      fetch("/api/auth/me"),
    ]);
    if (reportRes.ok) setReport(await reportRes.json());
    if (meRes.ok) setMe(await meRes.json());
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState only runs after the awaited fetch resolves, not synchronously in the effect body
    void load();
  }, [load]);

  function openApprove() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setApproveForm({
      category: "",
      goldenRule: "",
      severity: "medium",
      area: report?.viTri || "",
      nguoiKp: "",
      nkpEmail: "",
      deadline: d.toISOString().slice(0, 10),
    });
    setShowApprove(true);
  }

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/reports/${params.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(approveForm),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || "Duyet that bai");
      return;
    }
    setFixLink(data.fixLink);
    setShowApprove(false);
    load();
  }

  async function handleReject() {
    if (!confirm("Tu choi bao cao nay?")) return;
    const res = await fetch(`/api/reports/${params.id}/reject`, { method: "POST" });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error || "Tu choi that bai");
  }

  async function handleDelete() {
    if (!confirm("Xoa bao cao nay? Hanh dong nay khong the hoan tac!")) return;
    const res = await fetch(`/api/reports/${params.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) router.push("/reports");
  }

  if (!report) return <p className="text-sm text-slate-400">Dang tai...</p>;

  const canApprove = me && (me.role === "admin" || me.role === "quanly") && report.status === "pending";
  const canDelete = me?.role === "admin";

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => router.push("/reports")} className="mb-3 text-sm text-orange-600">
        &larr; Quay lai danh sach
      </button>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {fixLink && (
        <div className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          Da duyet! Link khac phuc (gui cho nguoi phu trach): <br />
          <code className="break-all text-xs">{fixLink}</code>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">Bao cao #{report.id}</h1>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">{report.status}</span>
        </div>

        <dl className="space-y-2 text-sm">
          <Row label="Nguoi bao cao" value={`${report.hoTen} (${report.maNv})`} />
          <Row label="Bo phan" value={report.boPhan || "-"} />
          <Row label="Xuong" value={report.xuong} />
          <Row label="Vi tri" value={report.viTri} />
          <Row label="Mo ta" value={report.noiDung} />
          {report.hinhAnh && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={report.hinhAnh} alt="Anh bao cao" className="mt-2 max-h-64 rounded border border-slate-200" />
          )}
          {report.category && <Row label="Phan loai" value={report.category} />}
          {report.goldenRule && <Row label="Golden Rule" value={report.goldenRule} />}
          {report.severity && <Row label="Muc do" value={report.severity} />}
          {report.nguoiKp && <Row label="Nguoi khac phuc" value={report.nguoiKp} />}
          {report.deadline && (
            <Row
              label="Han khac phuc"
              value={`${new Date(report.deadline).toLocaleDateString("vi-VN")} ${
                report.isOverdue ? "(QUA HAN)" : ""
              }`}
            />
          )}
          {report.status === "fixed" && (
            <>
              <Row label="Nguoi da KP" value={report.fixer || "-"} />
              <Row label="Ghi chu KP" value={report.fixNote || "-"} />
              {report.fixImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={report.fixImg} alt="Anh khac phuc" className="mt-2 max-h-64 rounded border border-slate-200" />
              )}
            </>
          )}
        </dl>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {canApprove && (
            <>
              <button
                onClick={openApprove}
                className="rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                Phe duyet
              </button>
              <button
                onClick={handleReject}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Tu choi
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="ml-auto rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Xoa bao cao
            </button>
          )}
        </div>
      </div>

      {showApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={handleApprove}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-bold text-slate-800">Phe duyet bao cao</h2>

            <label className="mb-1 block text-xs font-medium text-slate-600">Phan loai *</label>
            <input
              required
              className="mb-3 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={approveForm.category}
              onChange={(e) => setApproveForm({ ...approveForm, category: e.target.value })}
            />

            <label className="mb-1 block text-xs font-medium text-slate-600">Golden Rule *</label>
            <input
              required
              className="mb-3 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={approveForm.goldenRule}
              onChange={(e) => setApproveForm({ ...approveForm, goldenRule: e.target.value })}
            />

            <label className="mb-1 block text-xs font-medium text-slate-600">Muc do *</label>
            <select
              className="mb-3 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={approveForm.severity}
              onChange={(e) => setApproveForm({ ...approveForm, severity: e.target.value })}
            >
              <option value="low">Thap</option>
              <option value="medium">Trung binh</option>
              <option value="high">Cao</option>
              <option value="critical">Nghiem trong</option>
            </select>

            <label className="mb-1 block text-xs font-medium text-slate-600">Khu vuc *</label>
            <input
              required
              className="mb-3 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={approveForm.area}
              onChange={(e) => setApproveForm({ ...approveForm, area: e.target.value })}
            />

            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nguoi khac phuc *
            </label>
            <input
              required
              className="mb-3 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={approveForm.nguoiKp}
              onChange={(e) => setApproveForm({ ...approveForm, nguoiKp: e.target.value })}
            />

            <label className="mb-1 block text-xs font-medium text-slate-600">Email (khong bat buoc)</label>
            <input
              type="email"
              className="mb-3 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={approveForm.nkpEmail}
              onChange={(e) => setApproveForm({ ...approveForm, nkpEmail: e.target.value })}
            />

            <label className="mb-1 block text-xs font-medium text-slate-600">Han khac phuc *</label>
            <input
              type="date"
              required
              className="mb-4 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={approveForm.deadline}
              onChange={(e) => setApproveForm({ ...approveForm, deadline: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApprove(false)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Huy
              </button>
              <button
                type="submit"
                className="rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                Xac nhan duyet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
