import { useEffect, useMemo, useRef, useState } from "react";
import { formatFileSize, formatUploadedAt } from "@/lib/interviewPrep";
import type { ResumeFileType, ResumeParseStatus, ResumeProfile } from "@/lib/jobTypes";
import {
  addResume,
  deleteResume,
  getResumeFileType,
  getResumes,
  setDefaultResume,
  updateResume
} from "@/lib/resumeStorage";
import { cn } from "@/lib/utils";

type ResumeFolderProps = {
  onMessage: (message: string) => void;
};

type ParseResumeResponse = {
  extractedText?: unknown;
  usable?: unknown;
  warning?: unknown;
  error?: unknown;
};

const acceptedResumeTypes = ".pdf,.doc,.docx";

const parseStatusLabels: Record<ResumeParseStatus, string> = {
  pending: "DeepSeek 解析中",
  parsed: "已解析",
  manual_required: "需重传",
  failed: "解析失败"
};

const parseStatusClass: Record<ResumeParseStatus, string> = {
  pending: "border-sky-200 bg-sky-50 text-sky-700",
  parsed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  manual_required: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700"
};

function getResumeName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || fileName;
}

function fileTypeLabel(type: ResumeFileType) {
  return type === "unknown" ? "未知" : type.toUpperCase();
}

export function ResumeFolder({ onMessage }: ResumeFolderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [viewingResume, setViewingResume] = useState<ResumeProfile>();
  const [draftName, setDraftName] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [parsingIds, setParsingIds] = useState<string[]>([]);

  useEffect(() => {
    setResumes(getResumes());
  }, []);

  const defaultResume = useMemo(
    () => resumes.find((resume) => resume.isDefault),
    [resumes]
  );

  function sync(nextResumes: ResumeProfile[]) {
    setResumes(nextResumes);
  }

  function openViewer(resume: ResumeProfile) {
    const latest = getResumes().find((item) => item.id === resume.id) ?? resume;
    setViewingResume(latest);
    setDraftName(latest.name);
    setDraftNotes(latest.notes ?? "");
  }

  async function parseResumeFile(resume: ResumeProfile, file: File) {
    setParsingIds((ids) => [...ids, resume.id]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/parse-resume", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json().catch(() => ({}))) as ParseResumeResponse;

      if (!response.ok || typeof payload.extractedText !== "string" || !payload.extractedText.trim()) {
        const error = typeof payload.error === "string" ? payload.error : "简历解析失败，请换成文字版 PDF / DOCX 后重试。";
        const next = updateResume(resume.id, {
          parseStatus: "failed",
          notes: error
        });
        sync(next);
        onMessage(error);
        return;
      }

      const warning = typeof payload.warning === "string" ? payload.warning : "";
      const usable = payload.usable !== false;
      const next = updateResume(resume.id, {
        extractedText: payload.extractedText,
        parseStatus: usable ? "parsed" : "manual_required",
        notes: warning || (usable ? resume.notes : "简历解析质量不足，请重新上传文字版文件。")
      });
      sync(next);
      onMessage(
        warning || (usable ? "简历已解析完成，原文已保存到简历库。" : "简历解析质量不足，请重新上传文字版文件。")
      );
    } catch {
      const error = "简历解析失败，请稍后重试。";
      const next = updateResume(resume.id, {
        parseStatus: "failed",
        notes: error
      });
      sync(next);
      onMessage(error);
    } finally {
      setParsingIds((ids) => ids.filter((id) => id !== resume.id));
    }
  }

  async function handleUpload(file?: File) {
    if (!file) {
      return;
    }

    const fileType = getResumeFileType(file.name);

    if (fileType === "unknown") {
      onMessage("请上传 PDF、DOC 或 DOCX 简历。");
      return;
    }

    const now = new Date().toISOString();
    const resume: ResumeProfile = {
      id: crypto.randomUUID(),
      name: getResumeName(file.name),
      fileName: file.name,
      fileType,
      fileSize: file.size,
      uploadedAt: now,
      updatedAt: now,
      extractedText: "",
      parseStatus: "pending",
      isDefault: resumes.length === 0
    };

    const nextResumes = addResume(resume);
    sync(nextResumes);
    setExpanded(true);
    onMessage("简历已上传，正在解析原文。");
    await parseResumeFile(resume, file);
  }

  function saveViewerMeta() {
    if (!viewingResume) {
      return;
    }

    const next = updateResume(viewingResume.id, {
      name: draftName.trim() || viewingResume.name,
      notes: draftNotes
    });
    sync(next);
    setViewingResume(undefined);
    onMessage("简历信息已保存，原文未被修改。");
  }

  function renameResume(resume: ResumeProfile) {
    const nextName = window.prompt("请输入新的简历名称", resume.name)?.trim();

    if (!nextName) {
      return;
    }

    sync(updateResume(resume.id, { name: nextName }));
    onMessage("简历已重命名。");
  }

  function removeResume(resume: ResumeProfile) {
    if (!window.confirm(`确定删除「${resume.name}」吗？`)) {
      return;
    }

    sync(deleteResume(resume.id));
    onMessage("简历已删除。");
  }

  function markDefault(resume: ResumeProfile) {
    sync(setDefaultResume(resume.id));
    onMessage("默认简历已更新。");
  }

  return (
    <section className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
      <input
        ref={inputRef}
        type="file"
        accept={acceptedResumeTypes}
        className="hidden"
        onChange={(event) => {
          handleUpload(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-normal text-slate-950">简历文件夹</h2>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
              已上传 {resumes.length} 份
            </span>
            {defaultResume ? (
              <span className="max-w-full truncate rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                默认：{defaultResume.name}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            上传 PDF、DOC 或 DOCX 简历后自动解析。系统只保存提取出的原文，不保存原始文件，也不会润色或改写简历内容。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-9 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            上传简历
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            {expanded ? "收起" : "展开"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-3 grid gap-2">
          {resumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-sm text-slate-500">
              还没有上传简历。支持 PDF、DOC、DOCX，上传后会自动提取原文并调用 DeepSeek 校验解析质量。
            </div>
          ) : (
            resumes.map((resume) => {
              const isParsing = parsingIds.includes(resume.id) || resume.parseStatus === "pending";

              return (
                <article
                  key={resume.id}
                  className="grid gap-3 rounded-xl border border-slate-200/80 bg-white/85 px-3 py-3 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-950">{resume.name}</h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {fileTypeLabel(resume.fileType)}
                      </span>
                      {resume.isDefault ? (
                        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          默认
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium",
                          parseStatusClass[resume.parseStatus]
                        )}
                      >
                        {parseStatusLabels[resume.parseStatus]}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{resume.fileName}</span>
                      <span>{formatFileSize(resume.fileSize)}</span>
                      <span>上传：{formatUploadedAt(resume.uploadedAt)}</span>
                      <span>原文：{resume.extractedText.trim().length} 字</span>
                    </div>
                    {resume.notes ? <p className="mt-1 text-xs text-slate-500">{resume.notes}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="button"
                      disabled={resume.isDefault || isParsing || resume.parseStatus !== "parsed"}
                      onClick={() => markDefault(resume)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      设为默认
                    </button>
                    <button
                      type="button"
                      onClick={() => renameResume(resume)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
                    >
                      查看原文
                    </button>
                    <button
                      type="button"
                      disabled={isParsing}
                      onClick={() => openViewer(resume)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      重命名
                    </button>
                    <button
                      type="button"
                      disabled={isParsing}
                      onClick={() => removeResume(resume)}
                      className="h-8 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      删除
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      ) : null}

      {viewingResume ? (
        <div className="fixed inset-0 z-[80] bg-slate-950/20 px-4 py-5 backdrop-blur-sm">
          <div className="ml-auto flex h-full max-w-2xl flex-col rounded-2xl border border-white/80 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-semibold tracking-normal text-slate-950">查看简历原文</h3>
              <p className="mt-1 text-sm text-slate-500">
                原文来自文件解析结果，当前页面只允许查看，不会改写简历内容。
              </p>
            </div>
            <div className="grid flex-1 gap-3 overflow-y-auto px-5 py-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">简历名称</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">解析原文</span>
                <textarea
                  value={viewingResume.extractedText || "暂无可用原文。"}
                  rows={18}
                  readOnly
                  className="min-h-80 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700 outline-none"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">备注</span>
                <textarea
                  value={draftNotes}
                  rows={4}
                  onChange={(event) => setDraftNotes(event.target.value)}
                  placeholder="可记录这份简历适合的岗位方向。"
                  className="resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setViewingResume(undefined)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={saveViewerMeta}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                保存名称和备注
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
