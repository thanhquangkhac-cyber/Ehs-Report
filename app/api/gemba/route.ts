import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { gembaSubmitSchema } from "@/lib/validation/gemba";
import { extractInsertId } from "@/lib/db/insert-id";

const { gemba, qrAreas } = schema;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const rows = await db.select().from(gemba).orderBy(desc(gemba.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = gembaSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [area] = await db
    .select({ id: qrAreas.id })
    .from(qrAreas)
    .where(eq(qrAreas.maQr, data.maQr))
    .limit(1);

  const result = await db.insert(gemba).values({
    maQr: data.maQr,
    areaId: area?.id ?? null,
    xuong: data.xuong,
    khuVuc: data.khuVuc,
    phuTrach: data.phuTrach || null,
    maNv: data.maNv,
    hoTen: data.hoTen,
    boPhan: data.boPhan || null,
    interlock: data.interlock,
    checan: data.checan,
    tudien: data.tudien,
    s5Moitruong: data.s5Moitruong,
    coSuCo: data.coSuCo ? 1 : 0,
    ghiChu: data.ghiChu || null,
  });

  return NextResponse.json({ success: true, id: extractInsertId(result) });
}
