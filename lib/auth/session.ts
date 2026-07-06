import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

export type Role = "admin" | "quanly" | "nhanvien";

export interface SessionData {
  userId?: number;
  username?: string;
  role?: Role;
  displayName?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "ehs_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return session;
}
