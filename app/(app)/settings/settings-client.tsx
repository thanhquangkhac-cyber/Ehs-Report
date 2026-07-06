"use client";

import { useEffect, useState, useCallback } from "react";

type WebhookSetting = {
  eventKey: "baocao_moi" | "phe_duyet" | "phe_duyet_2" | "da_khac_phuc";
  webhookUrl: string;
  isEnabled: boolean;
};

const EVENT_LABEL: Record<WebhookSetting["eventKey"], string> = {
  baocao_moi: "Bao cao moi",
  phe_duyet: "Phe duyet (bao nguoi khac phuc)",
  phe_duyet_2: "Phe duyet (bao nguoi bao cao)",
  da_khac_phuc: "Da khac phuc",
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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/webhooks");
      if (res.ok) setWebhooks(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
