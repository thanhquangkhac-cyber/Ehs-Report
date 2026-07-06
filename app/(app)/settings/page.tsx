import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    redirect("/dashboard");
  }

  return <SettingsClient />;
}
