import { NextResponse } from "next/server";
import { getDeepSeekServerConfig, saveDeepSeekServerConfig } from "@/lib/deepseekConfig";

export const runtime = "nodejs";

type SaveConfigBody = {
  apiKey?: unknown;
  baseUrl?: unknown;
  model?: unknown;
  clearKey?: unknown;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const config = await getDeepSeekServerConfig();

  return NextResponse.json({
    configured: config.configured,
    keyPreview: config.keyPreview,
    baseUrl: config.baseUrl,
    model: config.model
  });
}

export async function POST(request: Request) {
  let body: SaveConfigBody;

  try {
    body = (await request.json()) as SaveConfigBody;
  } catch {
    return NextResponse.json({ error: "请求格式无效。" }, { status: 400 });
  }

  const model = safeString(body.model) || "deepseek-v4-flash";

  if (!["deepseek-v4-flash", "deepseek-v4-pro"].includes(model)) {
    return NextResponse.json({ error: "模型只能选择 deepseek-v4-flash 或 deepseek-v4-pro。" }, { status: 400 });
  }

  const config = await saveDeepSeekServerConfig({
    apiKey: safeString(body.apiKey),
    baseUrl: safeString(body.baseUrl) || "https://api.deepseek.com",
    model,
    clearKey: body.clearKey === true
  });

  return NextResponse.json({
    configured: config.configured,
    keyPreview: config.keyPreview,
    baseUrl: config.baseUrl,
    model: config.model
  });
}
