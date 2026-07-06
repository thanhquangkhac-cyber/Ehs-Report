import { NextRequest, NextResponse } from "next/server";
import { desc, eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { areaInputSchema } from "@/lib/validation/area";
import { generateMaQr } from "@/lib/slug";
import { extractInsertId } from "@/lib/db/insert-id";

const { qrAreas } = schema;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const rows = await db.select().from(qrAreas).orderBy(desc(qrAreas.id));
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
  const parsed = areaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [existing] = await db
    .select()
    .from(qrAreas)
    .where(and(eq(qrAreas.xuong, data.xuong), eq(qrAreas.khuVuc, data.khuVuc)))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Khu vuc nay da ton tai trong xuong da chon" },
      { status: 409 }
    );
  }

  const maQr = generateMaQr(data.xuong, data.khuVuc);

  const result = await db.insert(qrAreas).values({
    maQr,
    xuong: data.xuong,
    khuVuc: data.khuVuc,
    phuTrach: data.phuTrach || null,
  });

  return NextResponse.json({ success: true, id: extractInsertId(result), maQr });
}
