"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type ChecklistValue = "dat" | "khong_dat";

type GembaEntry = {
  id: number;
  xuong: string;
  khuVuc: string;
  phuTrach: string | null;
  hoTen: string;
  boPhan: string | null;
  interlock: ChecklistValue;
  checan: ChecklistValue;
  tudien: ChecklistValue;
  s5Moitruong: ChecklistValue;
  coSuCo: number;
  ghiChu: string | null;
};

export default function EditGembaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<GembaEntry | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/gemba");
    if (res.ok) {
      const all: GembaEntry[] = await res.json();
      const found = all.find((g) => g.id === Number(params.id));
      setEntry(found || null);
    }
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState only runs after the awaited fetch resolves, not synchronously in the effect body
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!entry) return;
    setError("");
    const res = await fetch(`/api/gemba/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || "Luu that bai");
      return;
    }
    router.push("/gemba");
  }

  if (!entry) return <p className="text-sm text-slate-400">Dang tai...</p>;

  const checklistItems: { key: keyof GembaEntry; label: string }[] = [
    { key: "interlock", label: "Interlock" },
    { key: "checan", label: "Che chan" },
    { key: "tudien", label: "Tu dien" },
    { key: "s5Moitruong", label: "S5 - Moi truong" },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Sua gemba #{entry.id}</h1>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Xuong</label>
            <input
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={entry.xuong}
              onChange={(e) => setEntry({ ...entry, xuong: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Khu vuc</label>
            <input
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={entry.khuVuc}
              onChange={(e) => setEntry({ ...entry, khuVuc: e.target.value })}
            />
          </div>
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
                    onClick={() => setEntry({ ...entry, [item.key]: "dat" })}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      entry[item.key] === "dat" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Dat
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntry({ ...entry, [item.key]: "khong_dat" })}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      entry[item.key] === "khong_dat" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
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
            checked={Boolean(entry.coSuCo)}
            onChange={(e) => setEntry({ ...entry, coSuCo: e.target.checked ? 1 : 0 })}
          />
          Phat hien su co
        </label>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ghi chu</label>
          <textarea
            rows={3}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={entry.ghiChu || ""}
            onChange={(e) => setEntry({ ...entry, ghiChu: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/gemba")}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Huy
          </button>
          <button
            type="submit"
            className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Luu
          </button>
        </div>
      </form>
    </div>
  );
}
