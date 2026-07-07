export type ChannelPlatform = "telegram" | "zalo" | "slack";

export type NotificationChannelRow = {
  id: number;
  platform: ChannelPlatform;
  name: string;
  isEnabled: number;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  zaloAccessToken: string | null;
  zaloRefreshToken: string | null;
  zaloAppId: string | null;
  zaloAppSecret: string | null;
  zaloOaId: string | null;
  zaloRecipientUserId: string | null;
  zaloTokenExpiresAt: string | null;
  slackWebhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
