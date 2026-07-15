import Link from "next/link";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import type { Job } from "@/lib/jobTypes";
import { normalizeUrl } from "@/lib/utils";

type InterviewTopBarProps = {
  job: Job;
  subtitle: string;
  backHref: string;
  backLabel: string;
  onUpdate: (patch: Partial<Job>) => void;
};

const inputClass =
  "h-10 rounded-xl border border-slate-200/80 bg-white/85 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100";

export function InterviewTopBar({ job, subtitle, backHref, backLabel, onUpdate }: InterviewTopBarProps) {
  const jobLink = normalizeUrl(job.link);

  return (
    <header className="rounded-3xl border border-white/70 bg-white/80 px-5 py-5 shadow-[0_24px_80px_rgba(79,70,229,0.12)] backdrop-blur sm:px-6">
      <Link href={backHref} className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">
        ← {backLabel}
      </Link>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
              {job.company || "未填写公司"}｜{job.title || "未填写岗位名称"}
            </h1>
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
          </div>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200/80 bg-white/85 px-4 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            返回投递表
          </Link>
          {jobLink ? (
            <button
              type="button"
              onClick={() => window.open(jobLink, "_blank", "noopener,noreferrer")}
              className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500"
            >
              打开岗位链接
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-500">下一步动作</span>
          <input
            value={job.nextAction ?? ""}
            onChange={(event) => onUpdate({ nextAction: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-500">下一步日期</span>
          <input
            type="date"
            value={job.nextActionDate ?? ""}
            onChange={(event) => onUpdate({ nextActionDate: event.target.value })}
            className={inputClass}
          />
        </label>
      </div>
    </header>
  );
}
