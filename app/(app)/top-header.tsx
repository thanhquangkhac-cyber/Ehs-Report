"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/auth/session";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Quan tri vien",
  quanly: "Quan ly",
  nhanvien: "Nhan vien",
};

export default function TopHeader({
  displayName,
  role,
  onMenuClick,
}: {
  displayName: string;
  role: Role;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("vi-VN"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Mo menu"
        >
          ☰
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
            E
          </div>
          <span className="text-sm font-bold text-slate-800">EHS SYSTEM</span>
        </div>
        <span className="hidden text-sm text-slate-400 lg:block">{time}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
            {displayName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-800">{displayName}</p>
            <p className="text-[11px] leading-tight text-slate-400">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Dang xuat
        </button>
      </div>
    </header>
  );
}
