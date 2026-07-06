"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import TopHeader from "./top-header";
import type { Role } from "@/lib/auth/session";

export default function AppShell({
  role,
  displayName,
  children,
}: {
  role: Role;
  displayName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader
          displayName={displayName}
          role={role}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
