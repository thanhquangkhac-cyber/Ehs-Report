import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { toDbDate } from "@/lib/db/date";

const { baoCao } = schema;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [report] = await db
    .select()
    .from(baoCao)
    .where(and(eq(baoCao.fixToken, token), gt(baoCao.fixTokenExpires, toDbDate(new Date()))))
    .limit(1);

  if (!report) {
    return NextResponse.json(
      { success: false, error: "Link khong hop le hoac da het han" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    report: {
      id: report.id,
      hoTen: report.hoTen,
      xuong: report.xuong,
      viTri: report.viTri,
      noiDung: report.noiDung,
      hinhAnh: report.hinhAnh,
      status: report.status,
      category: report.category,
      severity: report.severity,
      nguoiKp: report.nguoiKp,
      deadline: report.deadline,
    },
  });
}
