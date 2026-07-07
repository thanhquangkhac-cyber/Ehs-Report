import type { FormattedMessage } from "./format";
import type { NotificationChannelRow } from "./types";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function render(msg: FormattedMessage): string {
  const parts = [`<b>${escapeHtml(msg.title)}</b>`, msg.lines.map(escapeHtml).join("\n")];
  if (msg.url) parts.push(`<a href="${msg.url}">Xem bao cao</a>`);
  return parts.join("\n\n");
}

export async function sendTelegramMessage(
  channel: Pick<NotificationChannelRow, "telegramBotToken" | "telegramChatId">,
  msg: FormattedMessage
): Promise<{ success: boolean; error?: string }> {
  if (!channel.telegramBotToken || !channel.telegramChatId) {
    return { success: false, error: "Thieu bot token hoac chat id" };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${channel.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channel.telegramChatId,
        text: render(msg),
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { success: false, error: `Telegram API loi ${res.status}: ${body.slice(0, 200)}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Loi khong xac dinh" };
  }
}
