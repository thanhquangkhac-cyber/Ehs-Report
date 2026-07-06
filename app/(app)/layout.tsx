import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AppShell from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell role={user!.role!} displayName={user!.displayName ?? user!.username ?? ""}>
      {children}
    </AppShell>
  );
}
