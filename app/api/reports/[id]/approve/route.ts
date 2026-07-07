import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { reportApproveSchema } from "@/lib/validation/report";
import { computeDeadline } from "@/lib/report-status";
import { generateFixToken, computeFixTokenExpiry } from "@/lib/fix-token";
import { fireWebhook } from "@/lib/webhooks";
import { notify } from "@/lib/notifications/dispatch";
import { formatPheDuyet, formatPheDuyet2 } from "@/lib/notifications/format";
import { toDbDate } from "@/lib/db/date";

const { baoCao } = schema;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireRole(["admin", "quanly"]);
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

  const [report] = await db.select().from(baoCao).where(eq(baoCao.id, reportId)).limit(1);
  if (!report) {
    return NextResponse.json({ success: false, error: "Khong tim thay bao cao" }, { status: 404 });
  }
  if (report.status !== "pending") {
    return NextResponse.json(
      { success: false, error: "Bao cao nay da duoc xu ly truoc do" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = reportApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const approvedDate = new Date();
  // Use the caller-supplied deadline if provided (form defaults to +7 days
  // client-side), otherwise fall back to the same +7 day rule server-side.
  const deadline = data.deadline ? new Date(data.deadline) : computeDeadline(approvedDate);

  const fixToken = generateFixToken();
  const fixTokenExpires = computeFixTokenExpiry(approvedDate);

  await db
    .update(baoCao)
    .set({
      status: "approved",
      category: data.category,
      goldenRule: data.goldenRule,
      severity: data.severity,
      area: data.area,
      nguoiKp: data.nguoiKp,
      nguoiKpMaNv: data.nguoiKpMaNv || null,
      nkpChucVu: data.nkpChucVu || null,
      nkpEmail: data.nkpEmail || null,
      approvedBy: session.userId,
      approvedDate: toDbDate(approvedDate),
      deadline: toDbDate(deadline),
      fixToken,
      fixTokenExpires: toDbDate(fixTokenExpires),
    })
    .where(eq(baoCao.id, reportId));

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const fixLink = `${baseUrl}/fix/${fixToken}`;

  await fireWebhook("phe_duyet", {
    id: reportId,
    nguoiKp: data.nguoiKp,
    nkpEmail: data.nkpEmail,
    deadline: deadline.toISOString(),
    fixLink,
  });
  await fireWebhook("phe_duyet_2", {
    id: reportId,
    hoTen: report.hoTen,
    maNv: report.maNv,
  });
  await notify(
    "phe_duyet",
    formatPheDuyet({
      id: reportId,
      nguoiKp: data.nguoiKp,
      nkpEmail: data.nkpEmail,
      deadline: deadline.toISOString(),
      fixLink,
    })
  );
  await notify("phe_duyet_2", formatPheDuyet2({ id: reportId, hoTen: report.hoTen, maNv: report.maNv }));

  return NextResponse.json({ success: true, fixLink });
}
