import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
const { users } = schema;
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Thieu ten dang nhap hoac mat khau" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || !user.isActive) {
    return NextResponse.json(
      { success: false, error: "Sai ten dang nhap hoac mat khau" },
      { status: 401 }
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { success: false, error: "Sai ten dang nhap hoac mat khau" },
      { status: 401 }
    );
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.role = user.role;
  session.displayName = user.displayName ?? user.username;
  await session.save();

  return NextResponse.json({
    success: true,
    role: user.role,
    displayName: session.displayName,
  });
}
