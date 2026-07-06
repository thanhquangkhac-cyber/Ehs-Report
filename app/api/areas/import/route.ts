import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { readSheetAsRows, detectHeaderRow, extractDataRows } from "@/lib/excel";
import { AREA_IMPORT_COLS } from "@/lib/validation/area";
import { generateMaQr } from "@/lib/slug";

const { qrAreas } = schema;

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

  const detected = detectHeaderRow(rows, AREA_IMPORT_COLS, ["xuong", "khuVuc"]);
  if (!detected) {
    return NextResponse.json(
      { success: false, error: 'Khong tim thay cot "Xuong" hoac "Khu vuc" trong file' },
      { status: 400 }
    );
  }

  const dataRows = extractDataRows(rows, detected.headerRowIndex, detected.colMap);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of dataRows) {
    const xuong = (row.xuong || "").trim();
    const khuVuc = (row.khuVuc || "").trim();
    if (!xuong || !khuVuc) {
      skipped++;
      continue;
    }

    const maQr = generateMaQr(xuong, khuVuc);
    const phuTrach = row.phuTrach || null;

    const [existing] = await db
      .select()
      .from(qrAreas)
      .where(and(eq(qrAreas.xuong, xuong), eq(qrAreas.khuVuc, khuVuc)))
      .limit(1);

    if (existing) {
      await db
        .update(qrAreas)
        .set({ maQr, phuTrach })
        .where(eq(qrAreas.id, existing.id));
      updated++;
    } else {
      await db.insert(qrAreas).values({ maQr, xuong, khuVuc, phuTrach });
      inserted++;
    }
  }

  return NextResponse.json({ success: true, inserted, updated, skipped });
}
