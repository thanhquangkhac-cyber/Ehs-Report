import { NextResponse } from "next/server";
import { getSession, type Role, type SessionData } from "./session";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

/**
 * For use inside Route Handlers. Throws so callers can catch and map to a
 * consistent JSON error response via `handleAuthError`.
 */
export async function requireRole(
  allowedRoles: Role[]
): Promise<SessionData & { role: Role }> {
  const session = await getSession();
  if (!session.userId || !session.role) {
    throw new UnauthorizedError("Khong co quyen truy cap, vui long dang nhap");
  }
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError("Ban khong co quyen thuc hien hanh dong nay");
  }
  return session as SessionData & { role: Role };
}

export function handleAuthError(err: unknown): NextResponse | null {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ success: false, error: err.message }, { status: 403 });
  }
  return null;
}
