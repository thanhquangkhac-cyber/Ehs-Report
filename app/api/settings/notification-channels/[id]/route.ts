import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { EVENT_KEYS, validatePlatformFields } from "@/lib/notifications/constants";

const { notificationChannels, notificationChannelEvents } = schema;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const [existing] = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.id, channelId))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Khong tim thay kenh" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.name) {
    return NextResponse.json({ success: false, error: "Du lieu khong hop le" }, { status: 400 });
  }

  const merged = { ...existing, ...body };
  const validationError = validatePlatformFields(existing.platform, merged);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  await db
    .update(notificationChannels)
    .set({
      name: body.name,
      isEnabled: body.isEnabled === false ? 0 : 1,
      telegramBotToken: merged.telegramBotToken || null,
      telegramChatId: merged.telegramChatId || null,
      zaloAccessToken: merged.zaloAccessToken || null,
      zaloRefreshToken: merged.zaloRefreshToken || null,
      zaloAppId: merged.zaloAppId || null,
      zaloAppSecret: merged.zaloAppSecret || null,
      zaloOaId: merged.zaloOaId || null,
      zaloRecipientUserId: merged.zaloRecipientUserId || null,
      slackWebhookUrl: merged.slackWebhookUrl || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(notificationChannels.id, channelId));

  if (body.events && typeof body.events === "object") {
    for (const eventKey of EVENT_KEYS) {
      const isEnabled = body.events[eventKey] !== false ? 1 : 0;
      const [existingEvent] = await db
        .select()
        .from(notificationChannelEvents)
        .where(
          and(
            eq(notificationChannelEvents.channelId, channelId),
            eq(notificationChannelEvents.eventKey, eventKey)
          )
        )
        .limit(1);

      if (existingEvent) {
        await db
          .update(notificationChannelEvents)
          .set({ isEnabled })
          .where(eq(notificationChannelEvents.id, existingEvent.id));
      } else {
        await db.insert(notificationChannelEvents).values({ channelId, eventKey, isEnabled });
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  await db.delete(notificationChannels).where(eq(notificationChannels.id, channelId));

  return NextResponse.json({ success: true });
}
