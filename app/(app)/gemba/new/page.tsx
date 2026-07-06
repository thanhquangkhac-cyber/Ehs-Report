"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ChecklistValue = "dat" | "khong_dat";

function GembaFormInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState({
    maQr: params.get("qr") || "",
    xuong: params.get("xuong") || "",
    khuVuc: params.get("khuvuc") || "",
    phuTrach: "",
    maNv: "",
    hoTen: "",
    boPhan: "",
    interlock: "dat" as ChecklistValue,
    checan: "dat" as ChecklistValue,
    tudien: "dat" as ChecklistValue,
    s5Moitruong: "dat" as ChecklistValue,
    coSuCo: false,
    ghiChu: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookupBadge, setLookupBadge] = useState("");

  async function handleManvBlur() {
    if (!form.maNv || form.maNv.length < 3) return;
    try {
      const res = await fetch(`/api/members/lookup/${encodeURIComponent(form.maNv)}`);
      const data = await res.json();
      if (data.found) {
        setForm((f) => ({ ...f, hoTen: data.data.hoTen, boPhan: data.data.boPhan || "" }));
        setLookupBadge(`Da tim thay: ${data.data.hoTen}`);
      } else {
        setLookupBadge("Khong tim thay ma nhan vien");
      }
    } catch {
      // non-fatal; user can fill manually
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/gemba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gui that bai");
      router.push("/gemba");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loi khong xac dinh");
    } finally {
      setSubmitting(false);
    }
  }

  const checklistItems: { key: keyof typeof form; label: string }[] = [
    { key: "interlock", label: "Interlock" },
    { key: "checan", label: "Che chan" },
    { key: "tudien", label: "Tu dien" },
    { key: "s5Moitruong", label: "S5 - Moi truong" },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Gemba - Kiem tra hien truong</h1>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
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
            <label className="mb-1 block text-xs font-medium text-slate-600">Khu vuc *</label>
            <input
              required
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.khuVuc}
              onChange={(e) => setForm({ ...form, khuVuc: e.target.value })}
            />
          </div>
        </div>

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

        <div className="rounded border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Checklist</p>
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{item.label}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, [item.key]: "dat" })}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      form[item.key] === "dat"
                        ? "bg-green-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Dat
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, [item.key]: "khong_dat" })}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      form[item.key] === "khong_dat"
                        ? "bg-red-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Khong dat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.coSuCo}
            onChange={(e) => setForm({ ...form, coSuCo: e.target.checked })}
          />
          Phat hien su co
        </label>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ghi chu</label>
          <textarea
            rows={3}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.ghiChu}
            onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {submitting ? "Dang gui..." : "Gui gemba"}
        </button>
      </form>
    </div>
  );
}

export default function NewGembaPage() {
  return (
    <Suspense fallback={null}>
      <GembaFormInner />
    </Suspense>
  );
}
