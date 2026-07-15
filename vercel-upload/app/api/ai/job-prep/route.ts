import { NextResponse } from "next/server";
import { requestDeepSeekJson } from "@/lib/deepseekJson";

export const runtime = "nodejs";

type PrepInput = {
  job?: unknown;
  resumeText?: unknown;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function listField(value: unknown, fallback: string) {
  if (!Array.isArray(value)) {
    return [fallback];
  }

  const items = value
    .map((item) => safeString(item))
    .filter(Boolean)
    .slice(0, 8);

  return items.length > 0 ? items : [fallback];
}

function textField(value: unknown, fallback: string) {
  return safeString(value) || fallback;
}

function normalizeJob(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  const job = value as Record<string, unknown>;
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
    channel: safeString(job.channel),
    link: safeString(job.link),
    jdText: safeString(job.jdText).slice(0, 30000),
    notes: safeString(job.notes).slice(0, 10000)
  };
}

export async function POST(request: Request) {
  let body: PrepInput;

  try {
    body = (await request.json()) as PrepInput;
  } catch {
    return NextResponse.json({ error: "请求格式无效。" }, { status: 400 });
  }

  const job = normalizeJob(body.job);
  const resumeText = safeString(body.resumeText).slice(0, 30000);

  if (!job.company && !job.title && !job.jdText) {
    return NextResponse.json({ error: "岗位资料为空，请先补充岗位或 JD。" }, { status: 400 });
  }

  try {
    const parsed = await requestDeepSeekJson({
      systemPrompt:
        "你是求职前期准备分析助手。你的职责是把岗位事实、JD 和候选人简历整理成可核对的准备底稿，供用户继续交给 ChatGPT 深入准备。只使用输入中的信息，不编造公司信息、业务数据或候选人经历。缺少信息时明确标记。输出必须是严格 JSON。",
      userPrompt: `请分析下面这条岗位记录，并返回以下 JSON 字段：
{
  "readiness": "ready 或 needs_info",
  "jdText": "解析后的完整岗位 JD 原文，保留职责、任职要求、加分项和福利等信息，修正 OCR 噪声，不要总结或改写成提纲",
  "summary": "不超过 180 字的岗位准备结论",
  "jdFocus": ["JD 重点和可能考察方向，最多 8 条"],
  "matchPoints": ["简历与岗位的匹配点，最多 8 条"],
  "gaps": ["简历或材料中需要补足的缺口，最多 8 条"],
  "unknowns": ["目前无法确认、需要向 HR 或面试官确认的信息，最多 8 条"],
  "risks": ["投递或岗位判断中的风险提示，最多 8 条"],
  "actions": ["进入面试前最值得完成的动作，按优先级排列，最多 8 条"],
  "chatGptBrief": "给 ChatGPT 的准备方向摘要，不超过 500 字"
}

岗位记录：
${JSON.stringify(job)}

候选人简历文本：
${resumeText || "未选择可用简历"}`,
      timeoutMs: 120000
    });

    if (!parsed || typeof parsed !== "object") {
      throw new Error("DeepSeek 返回格式异常，请重试。");
    }

    const value = parsed as Record<string, unknown>;
    const readiness = value.readiness === "ready" ? "ready" : "needs_info";

    return NextResponse.json({
      readiness,
      jdText: textField(value.jdText, job.jdText || "暂无可用的岗位 JD 原文。"),
      summary: textField(value.summary, "请先补充岗位资料，再进行下一步准备。"),
      jdFocus: listField(value.jdFocus, "暂未提取到明确的 JD 重点。"),
      matchPoints: listField(value.matchPoints, "暂未发现可确认的匹配点。"),
      gaps: listField(value.gaps, "暂未发现明确的材料缺口。"),
      unknowns: listField(value.unknowns, "暂无待确认信息。"),
      risks: listField(value.risks, "暂无明显风险提示。"),
      actions: listField(value.actions, "补充岗位资料并确认下一步动作。"),
      chatGptBrief: textField(value.chatGptBrief, "请基于岗位 JD、简历匹配点和待补足信息继续准备。")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DeepSeek 前期分析失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
