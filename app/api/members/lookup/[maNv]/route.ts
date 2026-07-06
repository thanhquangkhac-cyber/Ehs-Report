import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";

const { thanhVien } = schema;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ maNv: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ found: false }, { status: 401 });
  }

  const { maNv } = await params;
  const [member] = await db
    .select()
    .from(thanhVien)
    .where(eq(thanhVien.maNv, maNv))
    .limit(1);

  if (!member) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    data: {
      hoTen: member.hoTen,
      boPhan: member.boPhan,
      xuong: member.xuong,
    },
  });
}
