import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";

const { qrAreas } = schema;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const { id } = await params;
  const areaId = Number(id);
  if (!Number.isInteger(areaId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  const [area] = await db.select().from(qrAreas).where(eq(qrAreas.id, areaId)).limit(1);
  if (!area) {
    return NextResponse.json({ success: false, error: "Khong tim thay khu vuc" }, { status: 404 });
  }

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const landingUrl = `${baseUrl}/landing?qr=${encodeURIComponent(area.maQr)}&xuong=${encodeURIComponent(
    area.xuong
  )}&khuvuc=${encodeURIComponent(area.khuVuc)}`;

  const pngBuffer = await QRCode.toBuffer(landingUrl, {
    type: "png",
    width: 400,
    margin: 2,
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
