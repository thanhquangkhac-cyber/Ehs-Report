"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type TokenReport = {
  id: number;
  hoTen: string;
  xuong: string;
  viTri: string;
  noiDung: string;
  hinhAnh: string | null;
  status: string;
  nguoiKp: string | null;
  deadline: string | null;
};

export default function FixByTokenPage() {
  const params = useParams<{ token: string }>();
  const [report, setReport] = useState<TokenReport | null>(null);
  const [loadError, setLoadError] = useState("");
  const [fixer, setFixer] = useState("");
  const [fixNote, setFixNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/reports/fix-token/${params.token}`);
    const data = await res.json();
    if (!data.success) {
      setLoadError(data.error || "Link khong hop le");
      return;
    }
    setReport(data.report);
    setFixer(data.report.nguoiKp || "");
  }, [params.token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState only runs after the awaited fetch resolves, not synchronously in the effect body
    void load();
  }, [load]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Vui long chon anh khac phuc");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const upRes = await fetch(`/api/upload?token=${params.token}`, {
        method: "POST",
        body: fd,
      });
      const upData = await upRes.json();
      if (!upData.success) throw new Error(upData.error || "Upload anh that bai");

      const res = await fetch(`/api/reports/${report!.id}/fix?token=${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixer, fixNote, fixImg: upData.url }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gui that bai");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loi khong xac dinh");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-red-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-400">Dang tai...</p>
      </div>
    );
  }

  if (done || report.status === "fixed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="font-semibold text-green-700">Da ghi nhan khac phuc. Cam on ban!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="mb-1 text-lg font-bold text-slate-800">Khac phuc bao cao #{report.id}</h1>
        <p className="mb-4 text-sm text-slate-500">
          {report.xuong} - {report.viTri}
        </p>
        <p className="mb-4 rounded bg-slate-50 p-3 text-sm text-slate-700">{report.noiDung}</p>

        {error && (
          <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nguoi khac phuc *</label>
            <input
              required
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={fixer}
              onChange={(e) => setFixer(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Noi dung khac phuc *
            </label>
            <textarea
              required
              rows={4}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={fixNote}
              onChange={(e) => setFixNote(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Anh khac phuc *</label>
            <input type="file" accept="image/*" required onChange={handleFileChange} className="text-sm" />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Xem truoc" className="mt-2 h-32 rounded border border-slate-200 object-cover" />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {submitting ? "Dang gui..." : "Xac nhan da khac phuc"}
          </button>
        </form>
      </div>
    </div>
  );
}
