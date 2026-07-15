"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InterviewTopBar } from "@/components/interview/InterviewTopBar";
import { getInterviewPrep } from "@/lib/interviewPrep";
import { loadJobs, saveJobs } from "@/lib/jobStorage";
import type { DeepSeekPrep, Job } from "@/lib/jobTypes";
import { getResumes } from "@/lib/resumeStorage";

function PrepList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 text-sm leading-6 text-slate-600">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function InterviewHubPage({ jobId }: { jobId: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const messageTimer = useRef<number | null>(null);

  useEffect(() => {
    setJobs(loadJobs());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveJobs(jobs);
    }
  }, [jobs, loaded]);

  useEffect(() => {
    return () => {
      if (messageTimer.current) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, []);

  const showMessage = useCallback((value: string) => {
    setMessage(value);

    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
    }

    messageTimer.current = window.setTimeout(() => setMessage(""), 2400);
  }, []);

  const job = useMemo(() => jobs.find((item) => item.id === jobId), [jobs, jobId]);
  const prep = job ? getInterviewPrep(job) : undefined;
  const resumes = loaded ? getResumes() : [];
  const defaultResume = resumes.find((resume) => resume.isDefault && resume.parseStatus === "parsed");
  const selectedResumeId = prep?.selectedResumeId === undefined ? defaultResume?.id ?? "" : prep.selectedResumeId;
  const currentJdText = prep?.deepseekPrep?.jdText?.trim() || prep?.jdText?.trim() || job?.jdText?.trim() || "";

  function updateJob(patch: Partial<Job>) {
    setJobs((currentJobs) =>
      currentJobs.map((item) =>
        item.id === jobId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    );
  }

  function selectResume(resumeId: string) {
    setJobs((currentJobs) =>
      currentJobs.map((item) =>
        item.id === jobId
          ? {
              ...item,
              interviewPrep: { ...getInterviewPrep(item), selectedResumeId: resumeId },
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );
  }

  async function runDeepSeekPrep() {
    if (!job || !prep || analyzing) {
      return;
    }

    const selectedResume = selectedResumeId
      ? resumes.find((resume) => resume.id === selectedResumeId)
      : undefined;

    setAnalyzing(true);

    try {
      const response = await fetch("/api/ai/job-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job,
          resumeText: selectedResume?.extractedText ?? ""
        })
      });
      const payload = (await response.json()) as DeepSeekPrep | { error?: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error || "DeepSeek 前期分析失败，请稍后重试。" : "DeepSeek 前期分析失败，请稍后重试。");
      }

      const data = payload as DeepSeekPrep;
      const result: DeepSeekPrep = {
        ...data,
        generatedAt: new Date().toISOString()
      };

      setJobs((currentJobs) =>
        currentJobs.map((item) =>
          item.id === jobId
            ? {
                ...item,
                interviewPrep: { ...getInterviewPrep(item), deepseekPrep: result },
                updatedAt: new Date().toISOString()
              }
            : item
        )
      );
      showMessage("DeepSeek 前期准备已完成，可以下载后交给 GPT。");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "DeepSeek 前期分析失败，请稍后重试。");
    } finally {
      setAnalyzing(false);
    }
  }

  function downloadDeepSeekPrep() {
    if (!job || !prep?.deepseekPrep) {
      return;
    }

    const result = prep.deepseekPrep;
    const list = (title: string, items: string[]) => `## ${title}\n${items.map((item) => `- ${item}`).join("\n")}\n`;
    const markdown = `# ${job.company || "未填写公司"}｜${job.title || "未填写岗位"}｜DeepSeek 前期准备\n\n生成时间：${new Date(result.generatedAt).toLocaleString("zh-CN")}\n准备状态：${result.readiness === "ready" ? "资料基本齐全" : "仍有资料需要补充"}\n\n## 解析后的岗位 JD 原文\n${result.jdText || job.jdText || "暂无可用的岗位 JD 原文。"}\n\n## 岗位准备结论\n${result.summary}\n\n${list("JD 重点与考察方向", result.jdFocus)}\n${list("简历匹配点", result.matchPoints)}\n${list("材料缺口", result.gaps)}\n${list("待确认信息", result.unknowns)}\n${list("风险提示", result.risks)}\n${list("进入面试前的行动清单", result.actions)}\n## 交给 ChatGPT 的准备方向\n${result.chatGptBrief}\n`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const fileName = `${job.company || "岗位"}-${job.title || "前期准备"}-DeepSeek.md`.replace(/[\\/:*?"<>|]/g, "_");

    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showMessage("准备文档已下载，可直接上传给 GPT。");
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        正在打开面试准备中心...
      </main>
    );
  }

  if (!job || !prep) {
    return (
      <main className="min-h-screen px-4 py-8 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white/80 px-6 py-8 shadow-sm backdrop-blur">
          <h1 className="text-xl font-semibold tracking-normal text-slate-950">未找到岗位</h1>
          <p className="mt-2 text-sm text-slate-500">这条岗位记录可能已被删除，或本地数据已重置。</p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            返回投递表
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <InterviewTopBar
          job={job}
          subtitle="面试准备中心"
          backHref="/"
          backLabel="返回投递表"
          onUpdate={updateJob}
        />

        <section className="rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-[0_18px_56px_rgba(79,70,229,0.09)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-normal text-slate-950">DeepSeek 前期准备</h2>
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  交给 GPT 前
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                先把岗位事实、JD 重点、简历匹配点和材料缺口整理清楚，再下载准备文档交给 ChatGPT 深入讨论。
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <select
                value={selectedResumeId}
                onChange={(event) => selectResume(event.target.value)}
                aria-label="选择用于 DeepSeek 匹配分析的简历"
                className="h-9 max-w-72 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">不附带简历</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id} disabled={resume.parseStatus !== "parsed"}>
                    {resume.name}{resume.isDefault ? "（默认）" : ""}{resume.parseStatus !== "parsed" ? "（未解析）" : ""}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runDeepSeekPrep}
                  disabled={analyzing}
                  className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {analyzing ? "DeepSeek 分析中…" : prep.deepseekPrep ? "重新分析" : "开始前期分析"}
                </button>
                {prep.deepseekPrep ? (
                  <button
                    type="button"
                    onClick={downloadDeepSeekPrep}
                    className="h-10 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    下载准备文档
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <article className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-950">解析后的岗位 JD 原文</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700">
                {prep.deepseekPrep ? "DeepSeek 已整理" : "待分析"}
              </span>
            </div>
            <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {currentJdText || "暂无岗位 JD 原文。请先在投递表中补充 JD，或使用智能录入识别岗位截图。"}
            </p>
          </article>

          {prep.deepseekPrep ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-950">岗位准备结论</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700">
                    {prep.deepseekPrep.readiness === "ready" ? "资料基本齐全" : "建议补充资料"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{prep.deepseekPrep.summary}</p>
              </article>
              <article className="rounded-xl border border-slate-200/80 bg-white p-4">
                <h3 className="mb-3 font-semibold text-slate-950">JD 重点与考察方向</h3>
                <PrepList items={prep.deepseekPrep.jdFocus} />
              </article>
              <article className="rounded-xl border border-slate-200/80 bg-white p-4">
                <h3 className="mb-3 font-semibold text-slate-950">简历匹配点</h3>
                <PrepList items={prep.deepseekPrep.matchPoints} />
              </article>
              <article className="rounded-xl border border-slate-200/80 bg-white p-4">
                <h3 className="mb-3 font-semibold text-slate-950">材料缺口与待确认信息</h3>
                <PrepList items={[...prep.deepseekPrep.gaps, ...prep.deepseekPrep.unknowns]} />
              </article>
              <article className="rounded-xl border border-slate-200/80 bg-white p-4">
                <h3 className="mb-3 font-semibold text-slate-950">风险提示与行动清单</h3>
                <PrepList items={[...prep.deepseekPrep.risks, ...prep.deepseekPrep.actions]} />
              </article>
              <article className="rounded-xl border border-slate-200/80 bg-white p-4 lg:col-span-2">
                <h3 className="font-semibold text-slate-950">交给 ChatGPT 的准备方向</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{prep.deepseekPrep.chatGptBrief}</p>
              </article>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {["岗位资料校验", "JD 重点提取", "简历匹配分析", "生成 GPT 准备文档"].map((step, index) => (
                <div key={step} className="rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-4">
                  <span className="text-xs font-semibold text-indigo-600">0{index + 1}</span>
                  <p className="mt-2 text-sm font-medium text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {message ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,0.15)] backdrop-blur">
          {message}
        </div>
      ) : null}
    </main>
  );
}
