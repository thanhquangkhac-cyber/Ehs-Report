import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";

const { users } = schema;

const changePasswordSchema = z.object({
  newPassword: z.string().min(4).max(255),
});

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole(["admin", "quanly", "nhanvien"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Mat khau toi thieu 4 ky tu" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, session.userId!));

  return NextResponse.json({ success: true });
}
