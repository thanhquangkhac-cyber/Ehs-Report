"use client";

import { useEffect, useState, useCallback } from "react";

type EventKey = "baocao_moi" | "phe_duyet" | "phe_duyet_2" | "da_khac_phuc";

type WebhookSetting = {
  eventKey: EventKey;
  webhookUrl: string;
  isEnabled: boolean;
};

const EVENT_LABEL: Record<EventKey, string> = {
  baocao_moi: "Bao cao moi",
  phe_duyet: "Phe duyet (bao nguoi khac phuc)",
  phe_duyet_2: "Phe duyet (bao nguoi bao cao)",
  da_khac_phuc: "Da khac phuc",
};

const EVENT_KEYS: EventKey[] = ["baocao_moi", "phe_duyet", "phe_duyet_2", "da_khac_phuc"];

type Platform = "telegram" | "zalo" | "slack";

const PLATFORM_LABEL: Record<Platform, string> = {
  telegram: "Telegram",
  zalo: "Zalo OA",
  slack: "Slack",
};

type NotificationChannel = {
  id: number;
  platform: Platform;
  name: string;
  isEnabled: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  zaloAccessToken: string | null;
  zaloRefreshToken: string | null;
  zaloAppId: string | null;
  zaloAppSecret: string | null;
  zaloOaId: string | null;
  zaloRecipientUserId: string | null;
  slackWebhookUrl: string | null;
  events: Record<EventKey, boolean>;
};

type NewChannelForm = {
  platform: Platform;
  name: string;
  telegramBotToken: string;
  telegramChatId: string;
  zaloAppId: string;
  zaloAppSecret: string;
  zaloAccessToken: string;
  zaloRefreshToken: string;
  zaloOaId: string;
  zaloRecipientUserId: string;
  slackWebhookUrl: string;
};

const EMPTY_NEW_CHANNEL: NewChannelForm = {
  platform: "telegram",
  name: "",
  telegramBotToken: "",
  telegramChatId: "",
  zaloAppId: "",
  zaloAppSecret: "",
  zaloAccessToken: "",
  zaloRefreshToken: "",
  zaloOaId: "",
  zaloRecipientUserId: "",
  slackWebhookUrl: "",
};

export default function SettingsClient() {
  const [webhooks, setWebhooks] = useState<WebhookSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannel, setNewChannel] = useState<NewChannelForm>(EMPTY_NEW_CHANNEL);
  const [channelSavingId, setChannelSavingId] = useState<number | "new" | null>(null);
  const [channelTestResult, setChannelTestResult] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/webhooks");
      if (res.ok) setWebhooks(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/notification-channels");
      if (res.ok) setChannels(await res.json());
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadChannels();
  }, [load, loadChannels]);

  async function createChannel() {
    setChannelSavingId("new");
    setMsg("");
    try {
      const res = await fetch("/api/settings/notification-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChannel),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Da tao kenh thong bao");
        setNewChannel(EMPTY_NEW_CHANNEL);
        setShowAddChannel(false);
        void loadChannels();
      } else {
        setMsg(data.error || "Tao kenh that bai");
      }
    } finally {
      setChannelSavingId(null);
    }
  }

  async function saveChannel(c: NotificationChannel) {
    setChannelSavingId(c.id);
    setMsg("");
    try {
      const res = await fetch(`/api/settings/notification-channels/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const data = await res.json();
      if (data.success) setMsg("Da luu kenh thong bao");
      else setMsg(data.error || "Luu that bai");
    } finally {
      setChannelSavingId(null);
    }
  }

  async function deleteChannel(id: number) {
    setChannelSavingId(id);
    try {
      await fetch(`/api/settings/notification-channels/${id}`, { method: "DELETE" });
      void loadChannels();
    } finally {
      setChannelSavingId(null);
    }
  }

  async function testChannel(id: number) {
    setChannelTestResult((prev) => ({ ...prev, [id]: "Dang gui..." }));
    try {
      const res = await fetch(`/api/settings/notification-channels/${id}/test`, { method: "POST" });
      const data = await res.json();
      setChannelTestResult((prev) => ({
        ...prev,
        [id]: data.success ? "Gui thanh cong" : `Loi: ${data.error || "khong xac dinh"}`,
      }));
    } catch {
      setChannelTestResult((prev) => ({ ...prev, [id]: "Loi ket noi" }));
    }
  }

  function updateChannel(id: number, patch: Partial<NotificationChannel>) {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function updateChannelEvent(id: number, eventKey: EventKey, enabled: boolean) {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, events: { ...c.events, [eventKey]: enabled } } : c))
    );
  }

  async function saveWebhook(w: WebhookSetting) {
    setSavingKey(w.eventKey);
    setMsg("");
    try {
      const res = await fetch("/api/settings/webhooks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(w),
      });
      const data = await res.json();
      if (data.success) setMsg("Da luu webhook");
    } finally {
      setSavingKey(null);
    }
  }

  function updateWebhook(key: string, patch: Partial<WebhookSetting>) {
    setWebhooks((prev) => prev.map((w) => (w.eventKey === key ? { ...w, ...patch } : w)));
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("Mat khau xac nhan khong khop");
      return;
    }
    if (newPassword.length < 4) {
      setPwError("Mat khau toi thieu 4 ky tu");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setPwError(data.error || "Doi mat khau that bai");
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setMsg("Da doi mat khau thanh cong");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Cai dat</h1>

      {msg && (
        <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">{msg}</div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Webhook thong bao</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Dang tai...</p>
        ) : (
          <div className="space-y-4">
            {webhooks.map((w) => (
              <div key={w.eventKey} className="border-b border-slate-100 pb-3 last:border-0">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {EVENT_LABEL[w.eventKey]}
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="https://..."
                    value={w.webhookUrl}
                    onChange={(e) => updateWebhook(w.eventKey, { webhookUrl: e.target.value })}
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={w.isEnabled}
                      onChange={(e) => updateWebhook(w.eventKey, { isEnabled: e.target.checked })}
                    />
                    Bat
                  </label>
                  <button
                    onClick={() => saveWebhook(w)}
                    disabled={savingKey === w.eventKey}
                    className="rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                  >
                    Luu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Kenh thong bao</h2>
        {channelsLoading ? (
          <p className="text-sm text-slate-400">Dang tai...</p>
        ) : (
          <div className="space-y-4">
            {channels.map((c) => (
              <div key={c.id} className="rounded border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {PLATFORM_LABEL[c.platform]} — {c.name}
                  </span>
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={c.isEnabled}
                      onChange={(e) => updateChannel(c.id, { isEnabled: e.target.checked })}
                    />
                    Bat
                  </label>
                </div>

                <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="Ten kenh"
                    value={c.name}
                    onChange={(e) => updateChannel(c.id, { name: e.target.value })}
                  />
                  {c.platform === "telegram" && (
                    <>
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Bot token"
                        value={c.telegramBotToken || ""}
                        onChange={(e) => updateChannel(c.id, { telegramBotToken: e.target.value })}
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Chat ID"
                        value={c.telegramChatId || ""}
                        onChange={(e) => updateChannel(c.id, { telegramChatId: e.target.value })}
                      />
                    </>
                  )}
                  {c.platform === "slack" && (
                    <input
                      className="rounded border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2"
                      placeholder="Slack Incoming Webhook URL"
                      value={c.slackWebhookUrl || ""}
                      onChange={(e) => updateChannel(c.id, { slackWebhookUrl: e.target.value })}
                    />
                  )}
                  {c.platform === "zalo" && (
                    <>
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="App ID"
                        value={c.zaloAppId || ""}
                        onChange={(e) => updateChannel(c.id, { zaloAppId: e.target.value })}
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="App Secret"
                        value={c.zaloAppSecret || ""}
                        onChange={(e) => updateChannel(c.id, { zaloAppSecret: e.target.value })}
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Access token"
                        value={c.zaloAccessToken || ""}
                        onChange={(e) => updateChannel(c.id, { zaloAccessToken: e.target.value })}
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Refresh token"
                        value={c.zaloRefreshToken || ""}
                        onChange={(e) => updateChannel(c.id, { zaloRefreshToken: e.target.value })}
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="OA ID"
                        value={c.zaloOaId || ""}
                        onChange={(e) => updateChannel(c.id, { zaloOaId: e.target.value })}
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Recipient user ID"
                        value={c.zaloRecipientUserId || ""}
                        onChange={(e) => updateChannel(c.id, { zaloRecipientUserId: e.target.value })}
                      />
                      <p className="text-xs text-slate-400 sm:col-span-2">
                        Zalo OA chi gui duoc tin nhan cho nguoi da tuong tac voi OA trong 7 ngay
                        gan nhat. Lay access/refresh token tu Zalo Developer Console.
                      </p>
                    </>
                  )}
                </div>

                <div className="mb-2 flex flex-wrap gap-3">
                  {EVENT_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-1 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={c.events[key] !== false}
                        onChange={(e) => updateChannelEvent(c.id, key, e.target.checked)}
                      />
                      {EVENT_LABEL[key]}
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveChannel(c)}
                    disabled={channelSavingId === c.id}
                    className="rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                  >
                    Luu
                  </button>
                  <button
                    onClick={() => testChannel(c.id)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Gui thu nghiem
                  </button>
                  <button
                    onClick={() => deleteChannel(c.id)}
                    disabled={channelSavingId === c.id}
                    className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Xoa
                  </button>
                  {channelTestResult[c.id] && (
                    <span className="text-xs text-slate-500">{channelTestResult[c.id]}</span>
                  )}
                </div>
              </div>
            ))}

            {showAddChannel ? (
              <div className="rounded border border-dashed border-slate-300 p-3">
                <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                    value={newChannel.platform}
                    onChange={(e) =>
                      setNewChannel((prev) => ({ ...prev, platform: e.target.value as Platform }))
                    }
                  >
                    <option value="telegram">Telegram</option>
                    <option value="zalo">Zalo OA</option>
                    <option value="slack">Slack</option>
                  </select>
                  <input
                    className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="Ten kenh"
                    value={newChannel.name}
                    onChange={(e) => setNewChannel((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  {newChannel.platform === "telegram" && (
                    <>
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Bot token"
                        value={newChannel.telegramBotToken}
                        onChange={(e) =>
                          setNewChannel((prev) => ({ ...prev, telegramBotToken: e.target.value }))
                        }
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Chat ID"
                        value={newChannel.telegramChatId}
                        onChange={(e) =>
                          setNewChannel((prev) => ({ ...prev, telegramChatId: e.target.value }))
                        }
                      />
                    </>
                  )}
                  {newChannel.platform === "slack" && (
                    <input
                      className="rounded border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2"
                      placeholder="Slack Incoming Webhook URL"
                      value={newChannel.slackWebhookUrl}
                      onChange={(e) =>
                        setNewChannel((prev) => ({ ...prev, slackWebhookUrl: e.target.value }))
                      }
                    />
                  )}
                  {newChannel.platform === "zalo" && (
                    <>
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="App ID"
                        value={newChannel.zaloAppId}
                        onChange={(e) => setNewChannel((prev) => ({ ...prev, zaloAppId: e.target.value }))}
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="App Secret"
                        value={newChannel.zaloAppSecret}
                        onChange={(e) =>
                          setNewChannel((prev) => ({ ...prev, zaloAppSecret: e.target.value }))
                        }
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Access token"
                        value={newChannel.zaloAccessToken}
                        onChange={(e) =>
                          setNewChannel((prev) => ({ ...prev, zaloAccessToken: e.target.value }))
                        }
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Refresh token"
                        value={newChannel.zaloRefreshToken}
                        onChange={(e) =>
                          setNewChannel((prev) => ({ ...prev, zaloRefreshToken: e.target.value }))
                        }
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="OA ID"
                        value={newChannel.zaloOaId}
                        onChange={(e) => setNewChannel((prev) => ({ ...prev, zaloOaId: e.target.value }))}
                      />
                      <input
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder="Recipient user ID"
                        value={newChannel.zaloRecipientUserId}
                        onChange={(e) =>
                          setNewChannel((prev) => ({ ...prev, zaloRecipientUserId: e.target.value }))
                        }
                      />
                      <p className="text-xs text-slate-400 sm:col-span-2">
                        Zalo OA chi gui duoc tin nhan cho nguoi da tuong tac voi OA trong 7 ngay
                        gan nhat. Lay access/refresh token tu Zalo Developer Console.
                      </p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createChannel}
                    disabled={channelSavingId === "new" || !newChannel.name}
                    className="rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                  >
                    Tao kenh
                  </button>
                  <button
                    onClick={() => {
                      setShowAddChannel(false);
                      setNewChannel(EMPTY_NEW_CHANNEL);
                    }}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Huy
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddChannel(true)}
                className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                + Them kenh moi
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Doi mat khau</h2>
        {pwError && (
          <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{pwError}</div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mat khau moi</label>
            <input
              type="password"
              required
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Xac nhan mat khau
            </label>
            <input
              type="password"
              required
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {pwSaving ? "Dang luu..." : "Doi mat khau"}
          </button>
        </form>
      </div>
    </div>
  );
}
