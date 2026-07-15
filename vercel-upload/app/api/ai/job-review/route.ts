import { NextResponse } from "next/server";
import { requestDeepSeekJson } from "@/lib/deepseekJson";

export const runtime = "nodejs";

type ReviewJob = {
  company?: unknown;
  title?: unknown;
  functionDirection?: unknown;
  industry?: unknown;
  city?: unknown;
  status?: unknown;
  priority?: unknown;
  deadline?: unknown;
  nextAction?: unknown;
  nextActionDate?: unknown;
  channel?: unknown;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeJobs(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 500).map((item) => {
    const job = (item && typeof item === "object" ? item : {}) as ReviewJob;
    return {
      company: safeString(job.company),
      title: safeString(job.title),
      functionDirection: safeString(job.functionDirection),
      industry: safeString(job.industry),
      city: safeString(job.city),
      status: safeString(job.status),
      priority: safeString(job.priority),
      deadline: safeString(job.deadline),
      nextAction: safeString(job.nextAction),
      nextActionDate: safeString(job.nextActionDate),
      channel: safeString(job.channel)
    };
  });
}

function textField(value: unknown, fallback: string) {
  const text = safeString(value);
  return text || fallback;
}

export async function POST(request: Request) {
  let body: { jobs?: unknown };

  try {
    body = (await request.json()) as { jobs?: unknown };
  } catch {
    return NextResponse.json({ error: "请求格式无效。" }, { status: 400 });
  }

  const jobs = normalizeJobs(body.jobs);

  if (jobs.length === 0) {
    return NextResponse.json({ error: "当前没有可复盘的岗位。" }, { status: 400 });
  }

  try {
    const parsed = await requestDeepSeekJson({
      systemPrompt:
        "你是求职进度复盘助手。只分析用户提供的结构化投递记录，不编造岗位结果，不提供空泛鼓励。输出必须是严格 JSON。",
      userPrompt: `今天是 ${new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" })}。请复盘以下投递记录，重点检查逾期事项、临近截止、缺失字段、长期未推进和投递结构失衡。

返回字段：
{
  "summary": "不超过 180 字的整体概况",
  "urgentActions": "按优先级列出未来 7 天最重要的行动",
  "dataGaps": "列出需要补充或纠正的岗位信息",
  "pipelineInsights": "分析投递阶段、岗位方向、城市或行业分布中的问题",
  "nextWeekPlan": "给出具体、可执行的下周计划"
}

投递记录：
${JSON.stringify(jobs)}`,
      timeoutMs: 120000
    });

    if (!parsed || typeof parsed !== "object") {
      throw new Error("DeepSeek 返回格式异常，请重试。");
    }

    const value = parsed as Record<string, unknown>;
    return NextResponse.json({
      summary: textField(value.summary, "暂无整体概况。"),
      urgentActions: textField(value.urgentActions, "暂无紧急行动。"),
      dataGaps: textField(value.dataGaps, "暂未发现明显漏项。"),
      pipelineInsights: textField(value.pipelineInsights, "暂无投递结构分析。"),
      nextWeekPlan: textField(value.nextWeekPlan, "请结合实际安排下周行动。")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "求职复盘失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
