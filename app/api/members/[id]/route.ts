import { NextRequest, NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { memberInputSchema } from "@/lib/validation/member";

const { thanhVien } = schema;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin", "quanly"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
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
    const [dup] = await db
      .select()
      .from(thanhVien)
      .where(and(eq(thanhVien.maNv, data.maNv), ne(thanhVien.id, memberId)))
      .limit(1);
    if (dup) {
      return NextResponse.json(
        { success: false, error: "Ma nhan vien da ton tai" },
        { status: 409 }
      );
    }
  }

  await db
    .update(thanhVien)
    .set({
      maNv: data.maNv || undefined,
      hoTen: data.hoTen,
      boPhan: data.boPhan || null,
      xuong: data.xuong || null,
      chucVu: data.chucVu || null,
      email: data.email || null,
      vaiTro: data.vaiTro,
    })
    .where(eq(thanhVien.id, memberId));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  await db.delete(thanhVien).where(eq(thanhVien.id, memberId));
  return NextResponse.json({ success: true });
}
