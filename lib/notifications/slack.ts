import type { FormattedMessage } from "./format";
import type { NotificationChannelRow } from "./types";

export async function sendSlackMessage(
  channel: Pick<NotificationChannelRow, "slackWebhookUrl">,
  msg: FormattedMessage
): Promise<{ success: boolean; error?: string }> {
  if (!channel.slackWebhookUrl) {
    return { success: false, error: "Thieu Slack webhook URL" };
  }
  try {
    const blocks: Record<string, unknown>[] = [
      { type: "header", text: { type: "plain_text", text: msg.title } },
      { type: "section", text: { type: "mrkdwn", text: msg.lines.join("\n") } },
    ];
    if (msg.url) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `<${msg.url}|Xem bao cao>` },
      });
    }
    const res = await fetch(channel.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msg.title, blocks }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { success: false, error: `Slack webhook loi ${res.status}: ${body.slice(0, 200)}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Loi khong xac dinh" };
  }
}
