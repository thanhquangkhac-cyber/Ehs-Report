"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth/session";

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  icon: string;
  badgeKey?: "reports" | "gemba";
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Tong quan",
    items: [{ href: "/dashboard", label: "Dashboard", roles: ["admin", "quanly", "nhanvien"], icon: "▣" }],
  },
  {
    title: "Bao cao",
    items: [
      {
        href: "/reports",
        label: "Safety Report",
        roles: ["admin", "quanly", "nhanvien"],
        icon: "⚠",
        badgeKey: "reports",
      },
      {
        href: "/gemba",
        label: "Gemba Walk",
        roles: ["admin", "quanly", "nhanvien"],
        icon: "✓",
        badgeKey: "gemba",
      },
    ],
  },
  {
    title: "Quan ly",
    items: [
      { href: "/areas", label: "Khu vuc / QR", roles: ["admin", "quanly"], icon: "▦" },
      { href: "/members", label: "Thanh vien", roles: ["admin", "quanly"], icon: "▤" },
    ],
  },
  {
    title: "Khac",
    items: [{ href: "/settings", label: "Cai dat", roles: ["admin"], icon: "⚙" }],
  },
];

function SidebarContent({
  role,
  pathname,
  badges,
  onNavigate,
}: {
  role: Role;
  pathname: string | null;
  badges: { reports: number; gemba: number };
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
          E
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-800">EHS SYSTEM</p>
          <p className="text-[11px] leading-tight text-slate-400">An toan - Suc khoe - Moi truong</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (!visibleItems.length) return null;
          return (
            <div key={group.title} className="mb-4">
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center justify-between rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 text-center">{item.icon}</span>
                        {item.label}
                      </span>
                      {badgeCount > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                            active ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </>
  );
}

export default function Sidebar({
  role,
  mobileOpen,
  onClose,
}: {
  role: Role;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<{ reports: number; gemba: number }>({
    reports: 0,
    gemba: 0,
  });

  const loadBadges = useCallback(async () => {
    const res = await fetch("/api/reports");
    if (res.ok) {
      const reports: { status: string }[] = await res.json();
      setBadges((b) => ({ ...b, reports: reports.filter((r) => r.status === "pending").length }));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState only runs after the awaited fetch resolves, not synchronously in the effect body
    void loadBadges();
  }, [loadBadges]);

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarContent role={role} pathname={pathname} badges={badges} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <SidebarContent role={role} pathname={pathname} badges={badges} onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
