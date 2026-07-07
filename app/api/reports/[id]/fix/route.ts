import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { reportFixSchema } from "@/lib/validation/report";
import { fireWebhook } from "@/lib/webhooks";
import { notify } from "@/lib/notifications/dispatch";
import { formatDaKhacPhuc } from "@/lib/notifications/format";
import { toDbDate } from "@/lib/db/date";

const { baoCao } = schema;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  const [report] = await db.select().from(baoCao).where(eq(baoCao.id, reportId)).limit(1);
  if (!report) {
    return NextResponse.json({ success: false, error: "Khong tim thay bao cao" }, { status: 404 });
  }

  // Authorization: either a logged-in admin/quanly (force-fix bypass), or a
  // valid unexpired fix_token supplied via ?token= (unauthenticated
  // magic-link flow reached from the approval email/message).
  const user = await getCurrentUser();
  const isStaff = user && (user.role === "admin" || user.role === "quanly");

  if (!isStaff) {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ success: false, error: "Khong co quyen" }, { status: 401 });
    }
    const [tokenMatch] = await db
      .select({ id: baoCao.id })
      .from(baoCao)
      .where(
        and(
          eq(baoCao.id, reportId),
          eq(baoCao.fixToken, token),
          gt(baoCao.fixTokenExpires, toDbDate(new Date()))
        )
      )
      .limit(1);
    if (!tokenMatch) {
      return NextResponse.json(
        { success: false, error: "Link khong hop le hoac da het han" },
        { status: 403 }
      );
    }
  }

  if (report.status === "fixed") {
    return NextResponse.json(
      { success: false, error: "Bao cao nay da duoc khac phuc" },
      { status: 409 }
    );
  }
  if (report.status === "rejected") {
    return NextResponse.json(
      { success: false, error: "Bao cao nay da bi tu choi" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = reportFixSchema.safeParse(body);
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
      status: "fixed",
      fixer: data.fixer,
      fixNote: data.fixNote,
      fixImg: data.fixImg,
      fixTime: toDbDate(new Date()),
    })
    .where(eq(baoCao.id, reportId));

  await fireWebhook("da_khac_phuc", {
    id: reportId,
    fixer: data.fixer,
    hoTen: report.hoTen,
  });
  await notify(
    "da_khac_phuc",
    formatDaKhacPhuc({ id: reportId, fixer: data.fixer, hoTen: report.hoTen, fixNote: data.fixNote, fixImg: data.fixImg })
  );

  return NextResponse.json({ success: true });
}
