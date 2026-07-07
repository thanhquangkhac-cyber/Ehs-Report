export const PLATFORMS = ["telegram", "zalo", "slack"] as const;
export const EVENT_KEYS = ["baocao_moi", "phe_duyet", "phe_duyet_2", "da_khac_phuc"] as const;

export function validatePlatformFields(platform: string, body: Record<string, unknown>): string | null {
  if (platform === "telegram") {
    if (!body.telegramBotToken || !body.telegramChatId) {
      return "Can bot token va chat id cho Telegram";
    }
  } else if (platform === "zalo") {
    if (
      !body.zaloAppId ||
      !body.zaloAppSecret ||
      !body.zaloAccessToken ||
      !body.zaloRefreshToken ||
      !body.zaloRecipientUserId
    ) {
      return "Can day du app id, app secret, access token, refresh token va recipient user id cho Zalo";
    }
  } else if (platform === "slack") {
    if (!body.slackWebhookUrl) {
      return "Can webhook URL cho Slack";
    }
  } else {
    return "Platform khong hop le";
  }
  return null;
}
