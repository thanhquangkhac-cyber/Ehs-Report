import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { buildCsv } from "@/lib/excel";

const { qrAreas } = schema;

export async function GET() {
  try {
    await requireRole(["admin", "quanly"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const rows = await db.select().from(qrAreas);
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  const csvRows = rows.map((a: typeof rows[number]) => ({
    "Ma QR": a.maQr,
    Xuong: a.xuong,
    "Khu vuc": a.khuVuc,
    "Phu trach": a.phuTrach || "",
    Link: `${baseUrl}/landing?qr=${encodeURIComponent(a.maQr)}&xuong=${encodeURIComponent(
      a.xuong
    )}&khuvuc=${encodeURIComponent(a.khuVuc)}`,
  }));

  const csv = buildCsv(["Ma QR", "Xuong", "Khu vuc", "Phu trach", "Link"], csvRows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="danh_sach_qr.csv"',
    },
  });
}
