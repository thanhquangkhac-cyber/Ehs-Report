import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { reportRejectSchema } from "@/lib/validation/report";

const { baoCao } = schema;

export async function POST(
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

  const body = await req.json().catch(() => ({}));
  const parsed = reportRejectSchema.safeParse(body);
  const reason = parsed.success ? parsed.data.rejectReason : null;

  await db
    .update(baoCao)
    .set({ status: "rejected", rejectReason: reason || null })
    .where(eq(baoCao.id, reportId));

  return NextResponse.json({ success: true });
}
