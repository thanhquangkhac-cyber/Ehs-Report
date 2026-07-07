import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import type { FormattedMessage } from "./format";
import type { NotificationChannelRow } from "./types";
import { sendTelegramMessage } from "./telegram";
import { sendZaloMessage } from "./zalo";
import { sendSlackMessage } from "./slack";

const { notificationChannels, notificationChannelEvents } = schema;

export type WebhookEventKey = "baocao_moi" | "phe_duyet" | "phe_duyet_2" | "da_khac_phuc";

/**
 * Fire-and-forget notification fanout across all enabled channels for an
 * event. Mirrors fireWebhook()'s "never throw, only log" convention - a
 * notification delivery problem must never fail the underlying report/
 * approve/fix operation. Runs alongside (not instead of) the existing
 * generic webhook mechanism in lib/webhooks.ts.
 */
export async function notify(eventKey: WebhookEventKey, formatted: FormattedMessage): Promise<void> {
  try {
    const rows: { channel: NotificationChannelRow }[] = await db
      .select({ channel: notificationChannels })
      .from(notificationChannelEvents)
      .innerJoin(notificationChannels, eq(notificationChannelEvents.channelId, notificationChannels.id))
      .where(
        and(
          eq(notificationChannelEvents.eventKey, eventKey),
          eq(notificationChannelEvents.isEnabled, 1),
          eq(notificationChannels.isEnabled, 1)
        )
      );

    await Promise.all(rows.map(({ channel }) => sendToChannel(channel, formatted, eventKey)));
  } catch (err) {
    console.error(`notify() lookup failed for ${eventKey}:`, err);
  }
}

async function sendToChannel(
  channel: NotificationChannelRow,
  formatted: FormattedMessage,
  eventKey: WebhookEventKey
): Promise<void> {
  try {
    const result = await sendViaPlatform(channel, formatted);
    if (!result.success) {
      console.error(`notification send failed [${channel.platform}#${channel.id}] for ${eventKey}:`, result.error);
    }
  } catch (err) {
    console.error(`notification send threw [${channel.platform}#${channel.id}] for ${eventKey}:`, err);
  }
}

export async function sendViaPlatform(
  channel: NotificationChannelRow,
  formatted: FormattedMessage
): Promise<{ success: boolean; error?: string }> {
  switch (channel.platform) {
    case "telegram":
      return sendTelegramMessage(channel, formatted);
    case "zalo":
      return sendZaloMessage(channel, formatted);
    case "slack":
      return sendSlackMessage(channel, formatted);
    default:
      return { success: false, error: `Platform khong ho tro: ${channel.platform}` };
  }
}
