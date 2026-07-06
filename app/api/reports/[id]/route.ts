import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { reportEditSchema } from "@/lib/validation/report";
import { computeOverdue } from "@/lib/report-status";
import { toDbDate } from "@/lib/db/date";

const { baoCao } = schema;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  const [report] = await db.select().from(baoCao).where(eq(baoCao.id, reportId)).limit(1);
  if (!report) {
    return NextResponse.json({ success: false, error: "Khong tim thay bao cao" }, { status: 404 });
  }

  const { isOverdue, daysRemaining } = computeOverdue({
    status: report.status,
    deadline: report.deadline,
  });

  return NextResponse.json({ ...report, isOverdue, daysRemaining });
}

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
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reportEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  await db
    .update(baoCao)
    .set({
      ...(data.hoTen !== undefined && { hoTen: data.hoTen }),
      ...(data.boPhan !== undefined && { boPhan: data.boPhan }),
      ...(data.xuong !== undefined && { xuong: data.xuong }),
      ...(data.viTri !== undefined && { viTri: data.viTri }),
      ...(data.noiDung !== undefined && { noiDung: data.noiDung }),
      ...(data.hinhAnh !== undefined && { hinhAnh: data.hinhAnh }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.goldenRule !== undefined && { goldenRule: data.goldenRule }),
      ...(data.severity !== undefined && { severity: data.severity }),
      ...(data.area !== undefined && { area: data.area }),
      ...(data.nguoiKp !== undefined && { nguoiKp: data.nguoiKp }),
      ...(data.nkpChucVu !== undefined && { nkpChucVu: data.nkpChucVu }),
      ...(data.nkpEmail !== undefined && { nkpEmail: data.nkpEmail }),
      ...(data.deadline !== undefined && {
        deadline: data.deadline ? toDbDate(new Date(data.deadline)) : null,
      }),
      ...(data.status !== undefined && { status: data.status }),
    })
    .where(eq(baoCao.id, reportId));

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
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  await db.delete(baoCao).where(eq(baoCao.id, reportId));
  return NextResponse.json({ success: true });
}
