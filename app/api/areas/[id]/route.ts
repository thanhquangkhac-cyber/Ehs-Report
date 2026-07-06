import { NextRequest, NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { areaInputSchema } from "@/lib/validation/area";
import { generateMaQr } from "@/lib/slug";

const { qrAreas } = schema;

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
  const areaId = Number(id);
  if (!Number.isInteger(areaId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = areaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [dup] = await db
    .select()
    .from(qrAreas)
    .where(
      and(
        eq(qrAreas.xuong, data.xuong),
        eq(qrAreas.khuVuc, data.khuVuc),
        ne(qrAreas.id, areaId)
      )
    )
    .limit(1);
  if (dup) {
    return NextResponse.json(
      { success: false, error: "Khu vuc nay da ton tai trong xuong da chon" },
      { status: 409 }
    );
  }

  const maQr = generateMaQr(data.xuong, data.khuVuc);

  await db
    .update(qrAreas)
    .set({
      maQr,
      xuong: data.xuong,
      khuVuc: data.khuVuc,
      phuTrach: data.phuTrach || null,
    })
    .where(eq(qrAreas.id, areaId));

  return NextResponse.json({ success: true, maQr });
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
  const areaId = Number(id);
  if (!Number.isInteger(areaId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  await db.delete(qrAreas).where(eq(qrAreas.id, areaId));
  return NextResponse.json({ success: true });
}
