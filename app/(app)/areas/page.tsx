"use client";

import { useEffect, useState, useCallback } from "react";

type Area = {
  id: number;
  maQr: string;
  xuong: string;
  khuVuc: string;
  phuTrach: string | null;
};

const emptyForm = { id: 0, xuong: "", khuVuc: "", phuTrach: "" };

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<{
    inserted: number;
    updated: number;
    skipped: number;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [qrPreview, setQrPreview] = useState<Area | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/areas");
      if (res.ok) setAreas(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = areas.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.xuong.toLowerCase().includes(q) ||
      a.khuVuc.toLowerCase().includes(q) ||
      a.maQr.toLowerCase().includes(q)
    );
  });

  function openNew() {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(a: Area) {
    setForm({ id: a.id, xuong: a.xuong, khuVuc: a.khuVuc, phuTrach: a.phuTrach || "" });
    setError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = { xuong: form.xuong, khuVuc: form.khuVuc, phuTrach: form.phuTrach };
    const res = await fetch(form.id ? `/api/areas/${form.id}` : "/api/areas", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || "Luu that bai");
      return;
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number, khuVuc: string) {
    if (!confirm(`Xoa khu vuc "${khuVuc}"?`)) return;
    const res = await fetch(`/api/areas/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) load();
  }

  async function handleImport(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/areas/import", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setImportResult({ inserted: data.inserted, updated: data.updated, skipped: data.skipped });
        load();
      } else {
        setError(data.error || "Import that bai");
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Khu vuc / QR ({areas.length})</h1>
        <div className="flex gap-2">
          {/* File download, not a page route - plain <a> is correct here. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/areas/export"
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Xuat CSV
          </a>
          <label className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {importing ? "Dang import..." : "Import Excel"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={openNew}
            className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + Them khu vuc
          </button>
        </div>
      </div>

      {importResult && (
        <div className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          Import xong! Them moi: {importResult.inserted} - Cap nhat: {importResult.updated} - Bo qua:{" "}
          {importResult.skipped}
        </div>
      )}

      <input
        placeholder="Tim theo xuong, khu vuc, ma QR..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Ma QR</th>
              <th className="px-3 py-2">Xuong</th>
              <th className="px-3 py-2">Khu vuc</th>
              <th className="px-3 py-2">Phu trach</th>
              <th className="px-3 py-2 text-center">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Dang tai...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Khong co khu vuc
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2 font-mono text-xs text-teal-700">{a.maQr}</td>
                  <td className="px-3 py-2">{a.xuong}</td>
                  <td className="px-3 py-2">{a.khuVuc}</td>
                  <td className="px-3 py-2">{a.phuTrach || "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <button
                      onClick={() => setQrPreview(a)}
                      className="mr-2 rounded px-2 py-1 text-xs text-teal-700 hover:bg-teal-50"
                    >
                      QR
                    </button>
                    <button
                      onClick={() => openEdit(a)}
                      className="mr-2 rounded px-2 py-1 text-xs text-orange-600 hover:bg-orange-50"
                    >
                      Sua
                    </button>
                    <button
                      onClick={() => handleDelete(a.id, a.khuVuc)}
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Xoa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {form.id ? "Sua khu vuc" : "Them khu vuc moi"}
            </h2>

            {error && (
              <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="mb-1 block text-xs font-medium text-slate-600">Xuong *</label>
            <input
              required
              className="mb-3 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.xuong}
              onChange={(e) => setForm({ ...form, xuong: e.target.value })}
            />

            <label className="mb-1 block text-xs font-medium text-slate-600">Khu vuc *</label>
            <input
              required
              className="mb-3 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.khuVuc}
              onChange={(e) => setForm({ ...form, khuVuc: e.target.value })}
            />

            <label className="mb-1 block text-xs font-medium text-slate-600">Phu trach</label>
            <input
              className="mb-4 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.phuTrach}
              onChange={(e) => setForm({ ...form, phuTrach: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
      )}

      {qrPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setQrPreview(null)}
        >
          <div
            className="w-full max-w-xs rounded-lg bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 font-bold text-slate-800">{qrPreview.khuVuc}</h2>
            <p className="mb-4 text-xs text-slate-500">{qrPreview.maQr}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/areas/qrcode/${qrPreview.id}`}
              alt={`QR ${qrPreview.maQr}`}
              className="mx-auto mb-4 h-48 w-48"
            />
            <div className="flex justify-center gap-2">
              <a
                href={`/api/areas/qrcode/${qrPreview.id}`}
                download={`${qrPreview.maQr}.png`}
                className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Tai xuong
              </a>
              <button
                onClick={() => setQrPreview(null)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Dong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
