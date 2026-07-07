import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { sendViaPlatform } from "@/lib/notifications/dispatch";
import type { NotificationChannelRow } from "@/lib/notifications/types";

const { notificationChannels } = schema;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const { id } = await params;
  const channelId = Number(id);
  if (!Number.isInteger(channelId)) {
    return NextResponse.json({ success: false, error: "ID khong hop le" }, { status: 400 });
  }

  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.id, channelId))
    .limit(1);
  if (!channel) {
    return NextResponse.json({ success: false, error: "Khong tim thay kenh" }, { status: 404 });
  }

  const result = await sendViaPlatform(channel as NotificationChannelRow, {
    title: "Tin nhan thu nghiem",
    lines: ["Day la tin nhan thu nghiem tu he thong EHS Report."],
  });

  return NextResponse.json(result);
}
