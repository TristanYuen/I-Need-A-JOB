import { getDeepSeekServerConfig } from "@/lib/deepseekConfig";

function stripCodeFence(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function requestDeepSeekJson(input: {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
}) {
  const config = await getDeepSeekServerConfig();

  if (!config.apiKey) {
    throw new Error("DeepSeek API Key 未配置，请先到设置页完成配置。");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 90000);

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("DeepSeek 请求失败，请检查设置或稍后重试。");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek 返回内容为空，请重试。");
    }

    try {
      return JSON.parse(stripCodeFence(content)) as unknown;
    } catch {
      throw new Error("DeepSeek 返回格式异常，请重试。");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("DeepSeek 请求超时，请稍后重试。");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
