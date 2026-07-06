import { NextRequest, NextResponse } from "next/server";
import { eq, gt, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { saveUploadedImage, UploadValidationError } from "@/lib/upload";
import { db, schema } from "@/lib/db/client";
import { toDbDate } from "@/lib/db/date";

const { baoCao } = schema;

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const user = await getCurrentUser();
  if (user) return true;

  // Unauthenticated magic-link fix flow: allow upload if a valid,
  // unexpired fix_token is supplied, scoping the upload to that report.
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return false;

  const [report] = await db
    .select({ id: baoCao.id })
    .from(baoCao)
    .where(and(eq(baoCao.fixToken, token), gt(baoCao.fixTokenExpires, toDbDate(new Date()))))
    .limit(1);

  return Boolean(report);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: "Khong co quyen" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Thieu file anh" },
      { status: 400 }
    );
  }

  try {
    const url = await saveUploadedImage(file);
    return NextResponse.json({ success: true, url });
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    throw err;
  }
}
