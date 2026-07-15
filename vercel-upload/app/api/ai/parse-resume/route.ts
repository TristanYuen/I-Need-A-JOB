import { NextResponse } from "next/server";
import { getDeepSeekServerConfig } from "@/lib/deepseekConfig";

export const runtime = "nodejs";

type ResumeFileType = "pdf" | "doc" | "docx";

type DeepSeekResumeCheck = {
  usable?: unknown;
  warnings?: unknown;
};

type PDFParseConstructor = new (input: {
  data: Buffer;
}) => {
  getText(): Promise<{ text?: string }>;
  destroy(): Promise<void>;
};

type MammothModule = {
  extractRawText(input: { buffer: Buffer }): Promise<{ value?: string }>;
};

type WordExtractorDocument = {
  getBody(): string;
};

type WordExtractorConstructor = new () => {
  extract(input: Buffer | string): Promise<WordExtractorDocument>;
};

const maxFileSize = 12 * 1024 * 1024;

function runtimeRequire(moduleName: string) {
  const requireFromRuntime = eval("require") as NodeRequire;
  return requireFromRuntime(moduleName) as unknown;
}

function getFileType(fileName: string): ResumeFileType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf" || extension === "doc" || extension === "docx") {
    return extension;
  }

  return null;
}

function cleanExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line.trim()))
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function compactContent(text: string) {
  return text.replace(/\s+/g, "");
}

function stripCodeFence(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseDeepSeekCheck(content: string): DeepSeekResumeCheck | null {
  try {
    const parsed = JSON.parse(stripCodeFence(content)) as DeepSeekResumeCheck;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function getWarningText(warnings: unknown) {
  if (!Array.isArray(warnings)) {
    return "";
  }

  return warnings
    .filter((warning): warning is string => typeof warning === "string" && Boolean(warning.trim()))
    .slice(0, 3)
    .join("；");
}

function limitForDeepSeek(text: string) {
  const maxLength = 16000;

  if (text.length <= maxLength) {
    return text;
  }

  const head = text.slice(0, 9000);
  const tail = text.slice(-6000);
  return `${head}\n\n[中间内容因长度限制省略，保存到简历库的原文未省略]\n\n${tail}`;
}

async function extractPdfText(buffer: Buffer) {
  const { PDFParse } = runtimeRequire("pdf-parse") as { PDFParse: PDFParseConstructor };
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return cleanExtractedText(result.text ?? "");
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer) {
  const mammoth = runtimeRequire("mammoth") as MammothModule;
  const result = await mammoth.extractRawText({ buffer });
  return cleanExtractedText(result.value ?? "");
}

async function extractDocText(buffer: Buffer) {
  const WordExtractor = runtimeRequire("word-extractor") as WordExtractorConstructor;
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  return cleanExtractedText(doc.getBody());
}

async function extractResumeText(buffer: Buffer, fileType: ResumeFileType) {
  if (fileType === "pdf") {
    return extractPdfText(buffer);
  }

  if (fileType === "docx") {
    return extractDocxText(buffer);
  }

  return extractDocText(buffer);
}

async function validateWithDeepSeek(input: {
  fileName: string;
  fileType: ResumeFileType;
  extractedText: string;
}) {
  const config = await getDeepSeekServerConfig();

  if (!config.apiKey) {
    return { usable: true, warning: "DeepSeek API Key 未配置，已保留文件解析原文。" };
  }

  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content:
              "你是简历文件解析质量校验器。你只判断从 PDF、DOC 或 DOCX 中提取出的文本是否可用于面试准备。禁止改写、润色、补写、翻译、重排或生成新的简历内容。输出必须是严格 JSON。"
          },
          {
            role: "user",
            content: `请校验以下简历解析文本是否可用。

文件名：${input.fileName}
文件类型：${input.fileType}

要求：
1. 只判断文本是否像一份可用简历。
2. 如果文本明显乱码、严重断裂、只有页眉页脚、缺少主体经历，usable 返回 false。
3. 不要返回改写后的简历正文。
4. 只返回 JSON：{"usable": true, "warnings": ["可选提醒"]}。

解析文本：
${limitForDeepSeek(input.extractedText)}`
          }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("DeepSeek 简历校验失败，请稍后重试。");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek 返回格式异常，请重试。");
    }

    const parsed = parseDeepSeekCheck(content);

    if (!parsed) {
      throw new Error("DeepSeek 返回格式解析失败。");
    }

    return {
      usable: parsed.usable !== false,
      warning: getWarningText(parsed.warnings)
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "请上传 PDF、DOC 或 DOCX 简历文件。" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传 PDF、DOC 或 DOCX 简历文件。" }, { status: 400 });
  }

  const fileType = getFileType(file.name);

  if (!fileType) {
    return NextResponse.json({ error: "请上传 PDF、DOC 或 DOCX 简历。" }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "简历文件过大，请控制在 12 MB 以内。" }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractResumeText(buffer, fileType);

    if (!compactContent(extractedText)) {
      return NextResponse.json(
        { error: "未从简历中提取到可用文字，请上传文字版 PDF、DOC 或 DOCX。" },
        { status: 422 }
      );
    }

    let validation = { usable: true, warning: "" };

    try {
      validation = await validateWithDeepSeek({
        fileName: file.name,
        fileType,
        extractedText
      });
    } catch {
      validation = { usable: true, warning: "DeepSeek 校验暂时失败，已保留文件解析原文。" };
    }

    return NextResponse.json({
      extractedText,
      usable: validation.usable,
      warning: validation.warning
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "简历解析失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
