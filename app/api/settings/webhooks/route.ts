import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";

const { webhookSettings } = schema;

const EVENT_KEYS = ["baocao_moi", "phe_duyet", "phe_duyet_2", "da_khac_phuc"] as const;

export async function GET() {
  try {
    await requireRole(["admin"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const rows: { eventKey: string; webhookUrl: string | null; isEnabled: number }[] =
    await db.select().from(webhookSettings);
  const byKey = new Map(rows.map((r) => [r.eventKey, r]));

  const result = EVENT_KEYS.map((key) => {
    const existing = byKey.get(key);
    return {
      eventKey: key,
      webhookUrl: existing?.webhookUrl || "",
      isEnabled: existing ? Boolean(existing.isEnabled) : true,
    };
  });

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(["admin"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const body = await req.json().catch(() => null);
  if (!body || !EVENT_KEYS.includes(body.eventKey)) {
    return NextResponse.json(
      { success: false, error: "Du lieu khong hop le" },
      { status: 400 }
    );
  }

  const { eventKey, webhookUrl, isEnabled } = body as {
    eventKey: (typeof EVENT_KEYS)[number];
    webhookUrl: string;
    isEnabled: boolean;
  };

  const [existing] = await db
    .select()
    .from(webhookSettings)
    .where(eq(webhookSettings.eventKey, eventKey))
    .limit(1);

  if (existing) {
    await db
      .update(webhookSettings)
      .set({ webhookUrl: webhookUrl || null, isEnabled: isEnabled ? 1 : 0 })
      .where(eq(webhookSettings.eventKey, eventKey));
  } else {
    await db.insert(webhookSettings).values({
      eventKey,
      webhookUrl: webhookUrl || null,
      isEnabled: isEnabled ? 1 : 0,
    });
  }

  return NextResponse.json({ success: true });
}
