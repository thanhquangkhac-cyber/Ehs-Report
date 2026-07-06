import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { gembaEditSchema } from "@/lib/validation/gemba";

const { gemba } = schema;

export async function PUT(
  req: NextRequest,
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
  const gembaId = Number(id);
  if (!Number.isInteger(gembaId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = gembaEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  await db
    .update(gemba)
    .set({
      ...(data.xuong !== undefined && { xuong: data.xuong }),
      ...(data.khuVuc !== undefined && { khuVuc: data.khuVuc }),
      ...(data.phuTrach !== undefined && { phuTrach: data.phuTrach }),
      ...(data.hoTen !== undefined && { hoTen: data.hoTen }),
      ...(data.boPhan !== undefined && { boPhan: data.boPhan }),
      ...(data.interlock !== undefined && { interlock: data.interlock }),
      ...(data.checan !== undefined && { checan: data.checan }),
      ...(data.tudien !== undefined && { tudien: data.tudien }),
      ...(data.s5Moitruong !== undefined && { s5Moitruong: data.s5Moitruong }),
      ...(data.coSuCo !== undefined && { coSuCo: data.coSuCo ? 1 : 0 }),
      ...(data.ghiChu !== undefined && { ghiChu: data.ghiChu }),
    })
    .where(eq(gemba.id, gembaId));

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
  const gembaId = Number(id);
  if (!Number.isInteger(gembaId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  await db.delete(gemba).where(eq(gemba.id, gembaId));
  return NextResponse.json({ success: true });
}
