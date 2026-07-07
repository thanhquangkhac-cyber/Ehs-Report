import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { requireRole, handleAuthError } from "@/lib/auth/guards";
import { EVENT_KEYS, PLATFORMS, validatePlatformFields } from "@/lib/notifications/constants";
import type { NotificationChannelRow } from "@/lib/notifications/types";

const { notificationChannels, notificationChannelEvents } = schema;

type ChannelEventRow = { channelId: number; eventKey: string; isEnabled: number };

export async function GET() {
  try {
    await requireRole(["admin"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const channels: NotificationChannelRow[] = await db.select().from(notificationChannels);
  const events: ChannelEventRow[] = await db.select().from(notificationChannelEvents);

  const result = channels.map((c) => {
    const channelEvents = events.filter((e) => e.channelId === c.id);
    const eventMap = Object.fromEntries(
      EVENT_KEYS.map((key) => [key, channelEvents.find((e) => e.eventKey === key)?.isEnabled !== 0])
    );
    return { ...c, isEnabled: Boolean(c.isEnabled), events: eventMap };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const body = await req.json().catch(() => null);
  if (!body || !PLATFORMS.includes(body.platform) || !body.name) {
    return NextResponse.json({ success: false, error: "Du lieu khong hop le" }, { status: 400 });
  }

  const validationError = validatePlatformFields(body.platform, body);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  const [inserted] = await db
    .insert(notificationChannels)
    .values({
      platform: body.platform,
      name: body.name,
      isEnabled: body.isEnabled === false ? 0 : 1,
      telegramBotToken: body.telegramBotToken || null,
      telegramChatId: body.telegramChatId || null,
      zaloAccessToken: body.zaloAccessToken || null,
      zaloRefreshToken: body.zaloRefreshToken || null,
      zaloAppId: body.zaloAppId || null,
      zaloAppSecret: body.zaloAppSecret || null,
      zaloOaId: body.zaloOaId || null,
      zaloRecipientUserId: body.zaloRecipientUserId || null,
      slackWebhookUrl: body.slackWebhookUrl || null,
    })
    .returning({ id: notificationChannels.id });

  const events: (typeof EVENT_KEYS)[number][] =
    Array.isArray(body.enabledEvents) && body.enabledEvents.length > 0
      ? body.enabledEvents.filter((k: string) => EVENT_KEYS.includes(k as (typeof EVENT_KEYS)[number]))
      : [...EVENT_KEYS];

  if (events.length > 0) {
    await db.insert(notificationChannelEvents).values(
      events.map((eventKey) => ({ channelId: inserted.id, eventKey, isEnabled: 1 }))
    );
  }

  return NextResponse.json({ success: true, id: inserted.id });
}
