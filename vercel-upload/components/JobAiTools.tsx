import { useEffect, useRef, useState } from "react";
import { compressImageToDataUrl } from "@/lib/imageCompression";
import type { Job } from "@/lib/jobTypes";

export type ParsedJobDraft = {
  company: string;
  title: string;
  functionDirection: string;
  industry: string;
  city: string;
  deadline: string;
  channel: string;
  link: string;
  jdText: string;
  notes: string;
};

type JobReview = {
  summary: string;
  urgentActions: string;
  dataGaps: string;
  pipelineInsights: string;
  nextWeekPlan: string;
};

type ScreenshotItem = {
  name: string;
  dataUrl: string;
};

type JobAiToolsProps = {
  mode: "import" | "review" | null;
  jobs: Job[];
  onClose: () => void;
  onAdd: (draft: ParsedJobDraft) => void;
  onMessage: (message: string) => void;
};

const acceptedTypes = new Set(["image/png", "image/jpg", "image/jpeg", "image/webp"]);

function getError(payload: unknown, fallback: string) {
  return payload && typeof payload === "object" && typeof (payload as { error?: unknown }).error === "string"
    ? (payload as { error: string }).error
    : fallback;
}

export function JobAiTools({ mode, jobs, onClose, onAdd, onMessage }: JobAiToolsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [review, setReview] = useState<JobReview>();

  useEffect(() => {
    setLoading(false);
    setProgress(0);
    setStage("");
    setReview(undefined);
    if (mode !== "import") setScreenshots([]);
  }, [mode]);

  if (!mode) return null;

  async function handleFiles(files: File[]) {
    const validFiles = files.filter((file) => acceptedTypes.has(file.type));

    if (validFiles.length === 0) {
      onMessage("请上传 png、jpg、jpeg 或 webp 岗位截图。");
      return;
    }

    setStage("正在压缩截图...");
    try {
      const items = await Promise.all(
        validFiles.map(async (file) => ({ name: file.name, dataUrl: await compressImageToDataUrl(file) }))
      );
      setScreenshots(items);
      setStage("");
    } catch {
      onMessage("截图读取失败，请重新上传。");
    }
  }

  async function recognizeAndImport() {
    if (screenshots.length === 0) {
      onMessage("请先上传岗位截图。");
      return;
    }

    setLoading(true);
    setStage("正在进行本地 OCR 识别...");
    setProgress(0);
    let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | undefined;

    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker(["chi_sim", "eng"], 1, {
        logger: (message) => {
          if (typeof message.progress === "number") {
            setProgress(Math.round(message.progress * 100));
          }
        }
      });
      const recognized: string[] = [];

      for (let index = 0; index < screenshots.length; index += 1) {
        setStage(`正在识别第 ${index + 1}/${screenshots.length} 张截图...`);
        const result = await worker.recognize(screenshots[index].dataUrl);
        if (result.data.text.trim()) recognized.push(result.data.text.trim());
      }

      const rawText = recognized.join("\n\n");
      if (rawText.length < 20) throw new Error("OCR 未识别到足够文字，请上传更清晰的截图。");

      setStage("DeepSeek 正在修正 OCR 并匹配表格字段...");
      const response = await fetch("/api/ai/parse-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: rawText })
      });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getError(payload, "智能录入失败，请稍后重试。"));

      onAdd(payload as ParsedJobDraft);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "智能录入失败，请稍后重试。");
    } finally {
      if (worker) await worker.terminate();
      setLoading(false);
      setProgress(0);
      setStage("");
    }
  }

  async function generateReview() {
    if (jobs.length === 0) {
      onMessage("当前没有可复盘的岗位。");
      return;
    }

    setLoading(true);
    setStage("DeepSeek 正在分析投递进度...");
    setReview(undefined);
    try {
      const response = await fetch("/api/ai/job-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs: jobs.map(({ company, title, functionDirection, industry, city, status, priority, deadline, nextAction, nextActionDate, channel }) => ({
            company, title, functionDirection, industry, city, status, priority, deadline, nextAction, nextActionDate, channel
          }))
        })
      });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getError(payload, "求职复盘失败，请稍后重试。"));
      setReview(payload as JobReview);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "求职复盘失败，请稍后重试。");
    } finally {
      setLoading(false);
      setStage("");
    }
  }

  const reviewSections = review
    ? [["整体概况", review.summary], ["优先行动", review.urgentActions], ["漏项检查", review.dataGaps], ["投递结构", review.pipelineInsights], ["下周计划", review.nextWeekPlan]]
    : [];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-sm">
      <button type="button" aria-label="关闭" onClick={onClose} className="absolute inset-0 cursor-default" />
      <section className="relative z-10 flex max-h-[calc(100vh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{mode === "import" ? "截图智能录入" : "求职周报与漏项检查"}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {mode === "import" ? "上传岗位截图，本地 OCR 识别后由 DeepSeek 修正并自动填写投递表。" : "基于当前投递记录梳理紧急事项、漏项和下周计划。"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-lg text-slate-500">×</button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {mode === "import" ? (
            <>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/png,image/jpg,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.currentTarget.value = "";
                  handleFiles(files);
                }}
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFiles(Array.from(event.dataTransfer.files));
                }}
                className="flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 disabled:opacity-60"
              >
                {screenshots.length ? (
                  <>
                    <span className="text-base font-semibold text-slate-900">已选择 {screenshots.length} 张岗位截图</span>
                    <span className="mt-2 text-sm text-slate-500">{screenshots.map((item) => item.name).join("、")}</span>
                    <span className="mt-3 text-xs font-medium text-indigo-600">点击可重新选择</span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-semibold text-slate-900">点击或拖拽上传岗位截图</span>
                    <span className="mt-2 text-sm text-slate-500">支持多张 png、jpg、jpeg、webp</span>
                  </>
                )}
              </button>
              {stage ? <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">{stage}{progress ? ` ${progress}%` : ""}</div> : null}
            </>
          ) : (
            <div className="grid gap-4">
              {!review ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">当前共有 {jobs.length} 条岗位记录。简历、面试材料和截图不会发送给 DeepSeek。</div> : null}
              {reviewSections.map(([title, content]) => (
                <section key={title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{content}</div>
                </section>
              ))}
              {stage ? <div className="text-sm font-medium text-indigo-600">{stage}</div> : null}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600">关闭</button>
          {mode === "import" ? (
            <button type="button" disabled={loading || screenshots.length === 0} onClick={recognizeAndImport} className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45">
              {loading ? "识别并填写中..." : "识别并自动填写"}
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={generateReview} className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-45">
              {loading ? "正在复盘..." : review ? "重新生成" : "开始复盘"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
