import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import type { FormattedMessage } from "./format";
import type { NotificationChannelRow } from "./types";

const { notificationChannels } = schema;

function render(msg: FormattedMessage): string {
  const parts = [msg.title, msg.lines.join("\n")];
  if (msg.url) parts.push(`Xem bao cao: ${msg.url}`);
  return parts.join("\n\n");
}

async function refreshAccessToken(
  channel: NotificationChannelRow
): Promise<{ accessToken: string; error?: string }> {
  if (!channel.zaloAppId || !channel.zaloAppSecret || !channel.zaloRefreshToken) {
    return { accessToken: "", error: "Thieu app id/app secret/refresh token de lam moi Zalo access token" };
  }
  try {
    const res = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        secret_key: channel.zaloAppSecret,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: channel.zaloRefreshToken,
        app_id: channel.zaloAppId,
      }),
    });
    const data = (await res.json().catch(() => null)) as
      | { access_token?: string; refresh_token?: string; expires_in?: string }
      | null;
    if (!res.ok || !data?.access_token) {
      return { accessToken: "", error: "Khong lam moi duoc Zalo access token" };
    }
    const expiresInSec = Number(data.expires_in) || 3600 * 24;
    const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

    await db
      .update(notificationChannels)
      .set({
        zaloAccessToken: data.access_token,
        zaloRefreshToken: data.refresh_token || channel.zaloRefreshToken,
        zaloTokenExpiresAt: expiresAt,
      })
      .where(eq(notificationChannels.id, channel.id));

    return { accessToken: data.access_token };
  } catch (err) {
    return { accessToken: "", error: err instanceof Error ? err.message : "Loi khong xac dinh khi lam moi token" };
  }
}

export async function sendZaloMessage(
  channel: NotificationChannelRow,
  msg: FormattedMessage
): Promise<{ success: boolean; error?: string }> {
  if (!channel.zaloRecipientUserId) {
    return { success: false, error: "Thieu Zalo recipient user id" };
  }

  let accessToken = channel.zaloAccessToken || "";
  const expiresAt = channel.zaloTokenExpiresAt ? new Date(channel.zaloTokenExpiresAt).getTime() : 0;
  const isExpiringSoon = !accessToken || expiresAt - Date.now() < 5 * 60 * 1000;

  if (isExpiringSoon) {
    const refreshed = await refreshAccessToken(channel);
    if (!refreshed.accessToken) {
      return { success: false, error: refreshed.error || "Khong the lam moi Zalo access token" };
    }
    accessToken = refreshed.accessToken;
  }

  try {
    const res = await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: accessToken,
      },
      body: JSON.stringify({
        recipient: { user_id: channel.zaloRecipientUserId },
        message: { text: render(msg) },
      }),
    });
    const body = (await res.json().catch(() => null)) as { error?: number; message?: string } | null;
    if (!res.ok || (body && body.error && body.error !== 0)) {
      return { success: false, error: body?.message || `Zalo API loi ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Loi khong xac dinh" };
  }
}
