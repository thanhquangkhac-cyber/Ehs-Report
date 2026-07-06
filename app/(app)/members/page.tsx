"use client";

import { useEffect, useState, useCallback } from "react";

type Member = {
  id: number;
  maNv: string;
  hoTen: string;
  boPhan: string | null;
  xuong: string | null;
  chucVu: string | null;
  email: string | null;
  vaiTro: "nhanvien" | "nguoikhacphuc" | "quanly";
};

const ROLE_LABEL: Record<Member["vaiTro"], string> = {
  nhanvien: "Nhan vien",
  nguoikhacphuc: "Nguoi khac phuc",
  quanly: "Quan ly",
};

const emptyForm = {
  id: 0,
  maNv: "",
  hoTen: "",
  boPhan: "",
  xuong: "",
  chucVu: "",
  email: "",
  vaiTro: "nhanvien" as Member["vaiTro"],
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        setMembers(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.hoTen.toLowerCase().includes(q) ||
      m.maNv.toLowerCase().includes(q) ||
      (m.boPhan || "").toLowerCase().includes(q)
    );
  });

  function openNew() {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(m: Member) {
    setForm({
      id: m.id,
      maNv: m.maNv,
      hoTen: m.hoTen,
      boPhan: m.boPhan || "",
      xuong: m.xuong || "",
      chucVu: m.chucVu || "",
      email: m.email || "",
      vaiTro: m.vaiTro,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      maNv: form.maNv || undefined,
      hoTen: form.hoTen,
      boPhan: form.boPhan,
      xuong: form.xuong,
      chucVu: form.chucVu,
      email: form.email,
      vaiTro: form.vaiTro,
    };
    const res = await fetch(form.id ? `/api/members/${form.id}` : "/api/members", {
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

  async function handleDelete(id: number, hoTen: string) {
    if (!confirm(`Xoa thanh vien "${hoTen}"?`)) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) load();
  }

  async function handleImport(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/members/import", { method: "POST", body: fd });
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
        <h1 className="text-xl font-bold text-slate-800">Thanh vien ({members.length})</h1>
        <div className="flex gap-2">
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
            + Them thanh vien
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
        placeholder="Tim theo ten, ma NV, bo phan..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Ma NV</th>
              <th className="px-3 py-2">Ho ten</th>
              <th className="px-3 py-2">Bo phan</th>
              <th className="px-3 py-2">Xuong</th>
              <th className="px-3 py-2">Chuc vu</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Vai tro</th>
              <th className="px-3 py-2 text-center">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  Dang tai...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  Khong co thanh vien
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 font-mono text-xs">{m.maNv}</td>
                  <td className="px-3 py-2 font-medium">{m.hoTen}</td>
                  <td className="px-3 py-2">{m.boPhan || "-"}</td>
                  <td className="px-3 py-2">{m.xuong || "-"}</td>
                  <td className="px-3 py-2">{m.chucVu || "-"}</td>
                  <td className="px-3 py-2 text-xs">{m.email || "-"}</td>
                  <td className="px-3 py-2">{ROLE_LABEL[m.vaiTro]}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <button
                      onClick={() => openEdit(m)}
                      className="mr-2 rounded px-2 py-1 text-xs text-orange-600 hover:bg-orange-50"
                    >
                      Sua
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.hoTen)}
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
              {form.id ? "Sua thanh vien" : "Them thanh vien moi"}
            </h2>

            {error && (
              <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Ma NV</label>
                <input
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={form.maNv}
                  onChange={(e) => setForm({ ...form, maNv: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Ho ten *
                </label>
                <input
                  required
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={form.hoTen}
                  onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Bo phan</label>
                <input
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={form.boPhan}
                  onChange={(e) => setForm({ ...form, boPhan: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Xuong</label>
                <input
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={form.xuong}
                  onChange={(e) => setForm({ ...form, xuong: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Chuc vu
                </label>
                <input
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={form.chucVu}
                  onChange={(e) => setForm({ ...form, chucVu: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Vai tro
                </label>
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={form.vaiTro}
                  onChange={(e) =>
                    setForm({ ...form, vaiTro: e.target.value as Member["vaiTro"] })
                  }
                >
                  <option value="nhanvien">Nhan vien</option>
                  <option value="nguoikhacphuc">Nguoi khac phuc</option>
                  <option value="quanly">Quan ly</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
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
    </div>
  );
}
