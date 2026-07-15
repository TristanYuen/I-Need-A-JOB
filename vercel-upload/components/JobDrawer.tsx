import { priorityTone, statusTone } from "@/components/StatusBadge";
import { channels, functionDirections, industries, priorities, statuses } from "@/lib/jobOptions";
import type { Job, JobPriority, JobStatus } from "@/lib/jobTypes";
import { cn, formatDisplayDate, normalizeUrl } from "@/lib/utils";

type JobDrawerProps = {
  job?: Job;
  onClose: () => void;
  onUpdate: (patch: Partial<Job>) => void;
  onDelete: () => void;
  onToast: (message: string) => void;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200/80 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";
const labelClass = "text-xs font-medium text-slate-500";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function JobDrawer({ job, onClose, onUpdate, onDelete, onToast }: JobDrawerProps) {
  if (!job) {
    return null;
  }

  const currentJob = job;
  const link = normalizeUrl(currentJob.link);

  function deleteJob() {
    const label = currentJob.company || currentJob.title || "这条岗位";

    if (window.confirm(`确认删除「${label}」吗？`)) {
      onDelete();
    }
  }

  function openLink() {
    if (!link) {
      onToast("请先填写岗位链接。");
      return;
    }

    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button
        type="button"
        aria-label="关闭详情"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-slate-950/20 xl:hidden"
      />
      <aside className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[420px] flex-col border-l border-slate-200/80 bg-white/95 shadow-sheet backdrop-blur">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">岗位详情</p>
              <h2 className="mt-1 truncate text-lg font-semibold tracking-normal text-slate-950">
                {job.company || "未填写公司"}
              </h2>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {job.title || "未填写岗位名称"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 shrink-0 rounded-md border border-slate-200/80 text-lg leading-none text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="状态">
                <select
                  value={job.status}
                  onChange={(event) => onUpdate({ status: event.target.value as JobStatus })}
                  className={cn(
                    "h-10 rounded-lg border px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100",
                    statusTone(job.status)
                  )}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="优先级">
                <select
                  value={job.priority}
                  onChange={(event) => onUpdate({ priority: event.target.value as JobPriority })}
                  className={cn(
                    "h-10 rounded-lg border px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100",
                    priorityTone(job.priority)
                  )}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="公司">
              <input
                value={job.company}
                onChange={(event) => onUpdate({ company: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="岗位名称">
              <input
                value={job.title}
                onChange={(event) => onUpdate({ title: event.target.value })}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="职能方向">
                <select
                  value={job.functionDirection}
                  onChange={(event) => onUpdate({ functionDirection: event.target.value })}
                  className={inputClass}
                >
                  {functionDirections.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="行业类型">
                <select
                  value={job.industry}
                  onChange={(event) => onUpdate({ industry: event.target.value })}
                  className={inputClass}
                >
                  {industries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="城市">
                <input
                  value={job.city}
                  onChange={(event) => onUpdate({ city: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="渠道">
                <select
                  value={job.channel}
                  onChange={(event) => onUpdate({ channel: event.target.value })}
                  className={inputClass}
                >
                  {channels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="投递日期">
                <input
                  type="date"
                  value={job.deadline}
                  onChange={(event) => onUpdate({ deadline: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="下一步日期">
                <input
                  type="date"
                  value={job.nextActionDate}
                  onChange={(event) => onUpdate({ nextActionDate: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="下一步动作">
              <input
                value={job.nextAction}
                onChange={(event) => onUpdate({ nextAction: event.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="岗位链接">
              <div className="flex gap-2">
                <input
                  value={job.link}
                  onChange={(event) => onUpdate({ link: event.target.value })}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={openLink}
                  className="h-10 shrink-0 rounded-lg border border-slate-200/80 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                >
                  打开
                </button>
              </div>
            </Field>

            <Field label="备注">
              <textarea
                value={job.notes}
                onChange={(event) => onUpdate({ notes: event.target.value })}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>

            <Field label="JD 原文">
              <textarea
                value={job.jdText}
                onChange={(event) => onUpdate({ jdText: event.target.value })}
                rows={6}
                className="w-full resize-y rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>

            <section className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-3">
              <h3 className="text-sm font-semibold text-slate-900">时间线</h3>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <span>创建时间</span>
                  <span>{formatDateTime(job.createdAt)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>最近更新</span>
                  <span>{formatDateTime(job.updatedAt)}</span>
                </div>
                {job.timeline.slice(-3).map((item) => (
                  <div key={item.id} className="rounded-md bg-white px-3 py-2 text-xs text-slate-500">
                    {formatDisplayDate(item.date.slice(0, 10))} · {item.content}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="border-t border-slate-200/80 px-5 py-4">
          <button
            type="button"
            onClick={deleteJob}
            className="h-10 w-full rounded-lg border border-rose-200 bg-rose-50 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            删除岗位
          </button>
        </div>
      </aside>
    </>
  );
}




