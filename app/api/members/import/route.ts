import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import {
  readSheetAsRows,
  detectHeaderRow,
  extractDataRows,
} from "@/lib/excel";
import { MEMBER_IMPORT_COLS, MEMBER_ROLE_ALIAS } from "@/lib/validation/member";

const { thanhVien } = schema;

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin", "quanly"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Thieu file Excel" },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const rows = readSheetAsRows(buffer);
  if (rows.length < 2) {
    return NextResponse.json(
      { success: false, error: "File khong co du lieu" },
      { status: 400 }
    );
  }

  const detected = detectHeaderRow(rows, MEMBER_IMPORT_COLS, ["hoTen"]);
  if (!detected) {
    return NextResponse.json(
      { success: false, error: 'Khong tim thay cot "Ho ten" trong file' },
      { status: 400 }
    );
  }

  const dataRows = extractDataRows(rows, detected.headerRowIndex, detected.colMap);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  // Dedup within the file itself: first occurrence of a ma_nv wins.
  const seenInFile = new Set<string>();

  for (const row of dataRows) {
    const hoTen = (row.hoTen || "").trim();
    if (!hoTen) {
      skipped++;
      continue;
    }

    const maNv = (row.maNv || "").trim();
    if (maNv) {
      if (seenInFile.has(maNv)) {
        skipped++;
        continue;
      }
      seenInFile.add(maNv);
    }

    const roleRaw = (row.vaiTro || "").toLowerCase().trim();
    const vaiTro = MEMBER_ROLE_ALIAS[roleRaw] || "nhanvien";

    const values = {
      hoTen,
      boPhan: row.boPhan || null,
      xuong: row.xuong || null,
      chucVu: row.chucVu || null,
      email: row.email || null,
      vaiTro,
    };

    if (maNv) {
      const [existing] = await db
        .select()
        .from(thanhVien)
        .where(eq(thanhVien.maNv, maNv))
        .limit(1);

      if (existing) {
        await db.update(thanhVien).set(values).where(eq(thanhVien.id, existing.id));
        updated++;
        continue;
      }
    }

    await db.insert(thanhVien).values({
      maNv: maNv || `NV-${Date.now()}-${inserted}`,
      ...values,
    });
    inserted++;
  }

  return NextResponse.json({ success: true, inserted, updated, skipped });
}
