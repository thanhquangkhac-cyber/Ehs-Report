import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { buildCsv } from "@/lib/excel";
import { computeOverdue } from "@/lib/report-status";

const { baoCao } = schema;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const rows = await db.select().from(baoCao);

  const csvRows = rows.map((r: (typeof rows)[number]) => {
    const { isOverdue, daysRemaining } = computeOverdue({
      status: r.status,
      deadline: r.deadline,
    });
    return {
      ID: r.id,
      "Ma NV": r.maNv,
      "Ho ten": r.hoTen,
      "Bo phan": r.boPhan || "",
      Xuong: r.xuong,
      "Vi tri": r.viTri,
      "Noi dung": r.noiDung,
      "Trang thai": r.status,
      "Phan loai": r.category || "",
      "Golden Rule": r.goldenRule || "",
      "Muc do": r.severity || "",
      "Nguoi khac phuc": r.nguoiKp || "",
      "Han KP": r.deadline || "",
      "Qua han": isOverdue ? "Co" : "Khong",
      "So ngay con lai": daysRemaining ?? "",
      "Ngay bao cao": r.createdAt,
    };
  });

  const headers = Object.keys(csvRows[0] || { ID: "" });
  const csv = buildCsv(headers, csvRows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="baocao.csv"',
    },
  });
}
