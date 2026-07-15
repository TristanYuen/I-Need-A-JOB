"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type DeepSeekSettings = {
  configured: boolean;
  keyPreview: string;
  baseUrl: string;
  model: string;
};

const defaultSettings: DeepSeekSettings = {
  configured: false,
  keyPreview: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash"
};

export function SettingsPage() {
  const [settings, setSettings] = useState<DeepSeekSettings>(defaultSettings);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(defaultSettings.baseUrl);
  const [model, setModel] = useState(defaultSettings.model);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings/deepseek");
        const payload = (await response.json()) as DeepSeekSettings;

        setSettings(payload);
        setBaseUrl(payload.baseUrl || defaultSettings.baseUrl);
        setModel(payload.model || defaultSettings.model);
      } catch {
        setMessage("读取设置失败，请刷新后重试。");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function saveSettings(clearKey = false) {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          model,
          clearKey
        })
      });
      const payload = (await response.json().catch(() => ({}))) as Partial<DeepSeekSettings> & {
        error?: string;
      };

      if (!response.ok) {
        setMessage(payload.error || "保存失败，请稍后重试。");
        return;
      }

      const nextSettings: DeepSeekSettings = {
        configured: Boolean(payload.configured),
        keyPreview: payload.keyPreview || "",
        baseUrl: payload.baseUrl || defaultSettings.baseUrl,
        model: payload.model || defaultSettings.model
      };

      setSettings(nextSettings);
      setBaseUrl(nextSettings.baseUrl);
      setModel(nextSettings.model);
      setApiKey("");
      setMessage(clearKey ? "DeepSeek API Key 已清除。" : "DeepSeek 设置已保存。");
    } catch {
      setMessage("保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="rounded-3xl border border-white/70 bg-white/80 px-5 py-5 shadow-[0_24px_80px_rgba(79,70,229,0.10)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-medium text-indigo-700">系统设置</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">设置</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                管理本地 AI 服务配置。API Key 只会写入服务端 `.env.local`，不会保存到浏览器本地存储。
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-10 w-fit items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              返回投递表
            </Link>
          </div>
        </header>

        <section className="grid gap-4 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-slate-950">DeepSeek 接入</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                配置后可使用岗位智能录入、求职周报、漏项检查和网申字段增强识别。
              </p>
            </div>
            <span
              className={cn(
                "w-fit rounded-full border px-3 py-1 text-xs font-semibold",
                settings.configured
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              )}
            >
              {settings.configured ? "已配置" : "未配置"}
            </span>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">API Key</span>
              <input
                value={apiKey}
                type="password"
                autoComplete="new-password"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={settings.configured ? `当前：${settings.keyPreview}` : "粘贴 DeepSeek API Key"}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
              <span className="text-xs leading-5 text-slate-500">
                留空保存时会保留当前 API Key。页面不会回显完整 Key。
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">服务地址</span>
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://api.deepseek.com"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">默认模型</span>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="deepseek-v4-flash">deepseek-v4-flash</option>
                <option value="deepseek-v4-pro">deepseek-v4-pro</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-5 text-slate-500">
               {loading ? "正在读取设置..." : "配置保存后会立即用于首页 AI 工具和浏览器扩展。"}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || loading || !settings.configured}
                onClick={() => saveSettings(true)}
                className="h-10 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                清除 Key
              </button>
              <button
                type="button"
                disabled={saving || loading}
                onClick={() => saveSettings(false)}
                className="h-10 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {saving ? "保存中..." : "保存设置"}
              </button>
            </div>
          </div>

          {message ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {message}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">
          <h2 className="text-xl font-semibold tracking-normal text-slate-950">功能边界</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            DeepSeek 只负责结构化录入、进度复盘和表单字段判断。面试准备会整理上下文并复制到 ChatGPT，已有材料继续保存在本地。
          </p>
        </section>
      </div>
    </main>
  );
}
