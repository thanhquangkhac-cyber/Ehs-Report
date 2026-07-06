import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { memberInputSchema } from "@/lib/validation/member";

const { thanhVien } = schema;

export async function GET() {
  try {
    await requireRole(["admin", "quanly"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const rows = await db.select().from(thanhVien).orderBy(desc(thanhVien.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin", "quanly"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const body = await req.json().catch(() => null);
  const parsed = memberInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.maNv) {
    const [existing] = await db
      .select()
      .from(thanhVien)
      .where(eq(thanhVien.maNv, data.maNv))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Ma nhan vien da ton tai" },
        { status: 409 }
      );
    }
  }

  const [inserted] = await db
    .insert(thanhVien)
    .values({
      maNv: data.maNv || `NV-${Date.now()}`,
      hoTen: data.hoTen,
      boPhan: data.boPhan || null,
      xuong: data.xuong || null,
      chucVu: data.chucVu || null,
      email: data.email || null,
      vaiTro: data.vaiTro,
    })
    .returning({ id: thanhVien.id });

  return NextResponse.json({ success: true, id: inserted.id });
}
