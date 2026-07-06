"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type GembaEntry = {
  id: number;
  maQr: string;
  xuong: string;
  khuVuc: string;
  phuTrach: string | null;
  hoTen: string;
  boPhan: string | null;
  interlock: "dat" | "khong_dat";
  checan: "dat" | "khong_dat";
  tudien: "dat" | "khong_dat";
  s5Moitruong: "dat" | "khong_dat";
  coSuCo: number;
  ghiChu: string | null;
  createdAt: string;
};

type Me = { role: "admin" | "quanly" | "nhanvien" };

function Check({ value }: { value: "dat" | "khong_dat" }) {
  return value === "dat" ? (
    <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">Dat</span>
  ) : (
    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">KD</span>
  );
}

export default function GembaPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<GembaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);

  const load = useCallback(async () => {
    try {
      const [entriesRes, meRes] = await Promise.all([
        fetch("/api/gemba"),
        fetch("/api/auth/me"),
      ]);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (meRes.ok) setMe(await meRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: number) {
    if (!confirm(`Xoa ban ghi gemba #${id}?`)) return;
    const res = await fetch(`/api/gemba/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) load();
  }

  const isAdmin = me?.role === "admin";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Gemba walk ({entries.length})</h1>
        <button
          onClick={() => router.push("/gemba/new")}
          className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + Gemba moi
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Xuong</th>
              <th className="px-3 py-2">Khu vuc</th>
              <th className="px-3 py-2">Nguoi KT</th>
              <th className="px-3 py-2">Interlock</th>
              <th className="px-3 py-2">Che chan</th>
              <th className="px-3 py-2">Tu dien</th>
              <th className="px-3 py-2">S5</th>
              <th className="px-3 py-2">Su co</th>
              <th className="px-3 py-2">Thoi gian</th>
              {isAdmin && <th className="px-3 py-2 text-center">Thao tac</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  Dang tai...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  Khong co du lieu
                </td>
              </tr>
            ) : (
              entries.map((g) => (
                <tr key={g.id}>
                  <td className="px-3 py-2">{g.xuong}</td>
                  <td className="px-3 py-2">{g.khuVuc}</td>
                  <td className="px-3 py-2">
                    {g.hoTen}
                    <div className="text-xs text-slate-400">{g.boPhan || ""}</div>
                  </td>
                  <td className="px-3 py-2">
                    <Check value={g.interlock} />
                  </td>
                  <td className="px-3 py-2">
                    <Check value={g.checan} />
                  </td>
                  <td className="px-3 py-2">
                    <Check value={g.tudien} />
                  </td>
                  <td className="px-3 py-2">
                    <Check value={g.s5Moitruong} />
                  </td>
                  <td className="px-3 py-2">
                    {g.coSuCo ? (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                        Co
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                    {new Date(g.createdAt).toLocaleString("vi-VN")}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-3 py-2 text-center">
                      <Link
                        href={`/gemba/${g.id}`}
                        className="mr-2 rounded px-2 py-1 text-xs text-orange-600 hover:bg-orange-50"
                      >
                        Sua
                      </Link>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Xoa
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
