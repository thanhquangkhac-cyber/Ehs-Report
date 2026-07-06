import { eq } from "drizzle-orm";
import { db, schema } from "./db/client";

const { webhookSettings } = schema;

export type WebhookEventKey =
  | "baocao_moi"
  | "phe_duyet"
  | "phe_duyet_2"
  | "da_khac_phuc";

/**
 * Fire-and-forget POST to the configured webhook URL for the given event,
 * if one is set and enabled. Failures are logged, never thrown - a webhook
 * delivery problem must not fail the underlying report/gemba operation.
 * No real chat-platform (Zalo/Telegram) formatting is implemented yet;
 * this just posts the raw payload as JSON.
 */
export async function fireWebhook(
  eventKey: WebhookEventKey,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const [setting] = await db
      .select()
      .from(webhookSettings)
      .where(eq(webhookSettings.eventKey, eventKey))
      .limit(1);

    if (!setting || !setting.isEnabled || !setting.webhookUrl) return;

    await fetch(setting.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: eventKey, ...payload }),
    }).catch((err) => {
      console.error(`Webhook delivery failed for ${eventKey}:`, err);
    });
  } catch (err) {
    console.error(`Webhook lookup failed for ${eventKey}:`, err);
  }
}
