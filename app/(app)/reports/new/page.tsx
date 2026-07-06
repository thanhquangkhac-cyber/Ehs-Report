"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ReportFormInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState({
    maNv: "",
    hoTen: "",
    boPhan: "",
    xuong: params.get("xuong") || "",
    viTri: params.get("vitri") || "",
    noiDung: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookupBadge, setLookupBadge] = useState("");

  async function handleManvBlur() {
    if (!form.maNv || form.maNv.length < 3) return;
    try {
      const res = await fetch(`/api/members/lookup/${encodeURIComponent(form.maNv)}`);
      const data = await res.json();
      if (data.found) {
        setForm((f) => ({
          ...f,
          hoTen: data.data.hoTen,
          boPhan: data.data.boPhan || "",
          xuong: data.data.xuong || f.xuong,
        }));
        setLookupBadge(`Da tim thay: ${data.data.hoTen}`);
      } else {
        setLookupBadge("Khong tim thay ma nhan vien");
      }
    } catch {
      // lookup failures are non-fatal; user can still fill the form manually
    }
  }

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
    setSubmitting(true);
    try {
      let hinhAnh: string | null = null;
      if (file) {
        const fd = new FormData();
        fd.append("image", file);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upData.success) throw new Error(upData.error || "Upload anh that bai");
        hinhAnh = upData.url;
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hinhAnh }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gui bao cao that bai");

      router.push("/reports");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loi khong xac dinh");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Bao cao an toan moi</h1>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ma nhan vien *</label>
          <input
            required
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.maNv}
            onChange={(e) => setForm({ ...form, maNv: e.target.value })}
            onBlur={handleManvBlur}
          />
          {lookupBadge && <p className="mt-1 text-xs text-slate-500">{lookupBadge}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ho ten *</label>
          <input
            required
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.hoTen}
            onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Bo phan</label>
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.boPhan}
            onChange={(e) => setForm({ ...form, boPhan: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Xuong *</label>
            <input
              required
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.xuong}
              onChange={(e) => setForm({ ...form, xuong: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Vi tri *</label>
            <input
              required
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.viTri}
              onChange={(e) => setForm({ ...form, viTri: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Mo ta *</label>
          <textarea
            required
            rows={4}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.noiDung}
            onChange={(e) => setForm({ ...form, noiDung: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Anh (khong bat buoc)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Xem truoc" className="mt-2 h-32 rounded border border-slate-200 object-cover" />
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {submitting ? "Dang gui..." : "Gui bao cao"}
        </button>
      </form>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportFormInner />
    </Suspense>
  );
}
