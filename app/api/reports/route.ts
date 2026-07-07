import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { reportSubmitSchema } from "@/lib/validation/report";
import { computeOverdue } from "@/lib/report-status";
import { fireWebhook } from "@/lib/webhooks";
import { notify } from "@/lib/notifications/dispatch";
import { formatBaocaoMoi } from "@/lib/notifications/format";

const { baoCao } = schema;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const rows = await db.select().from(baoCao).orderBy(desc(baoCao.id));

  const withComputed = rows.map((r: (typeof rows)[number]) => {
    const { isOverdue, daysRemaining } = computeOverdue({
      status: r.status,
      deadline: r.deadline,
    });
    return { ...r, isOverdue, daysRemaining };
  });

  return NextResponse.json(withComputed);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chua dang nhap" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reportSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [inserted] = await db
    .insert(baoCao)
    .values({
      maNv: data.maNv,
      hoTen: data.hoTen,
      boPhan: data.boPhan || null,
      xuong: data.xuong,
      viTri: data.viTri,
      noiDung: data.noiDung,
      hinhAnh: data.hinhAnh || null,
      status: "pending",
    })
    .returning({ id: baoCao.id });

  const id = inserted.id;

  await fireWebhook("baocao_moi", {
    id,
    hoTen: data.hoTen,
    xuong: data.xuong,
    viTri: data.viTri,
  });
  await notify(
    "baocao_moi",
    formatBaocaoMoi({ id, hoTen: data.hoTen, xuong: data.xuong, viTri: data.viTri, noiDung: data.noiDung })
  );

  return NextResponse.json({ success: true, id });
}
