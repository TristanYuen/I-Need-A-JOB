import type { JobPriority, JobStatus } from "@/lib/jobTypes";
import { cn } from "@/lib/utils";

const statusStyles: Record<JobStatus, string> = {
  收藏: "border-slate-200 bg-slate-100/80 text-slate-700",
  待投: "border-blue-200 bg-blue-50 text-blue-700",
  已投: "border-violet-200 bg-violet-50 text-violet-700",
  笔试: "border-orange-200 bg-orange-50 text-orange-700",
  面试: "border-amber-200 bg-amber-50 text-amber-700",
  Offer: "border-emerald-200 bg-emerald-50 text-emerald-700",
  拒绝: "border-rose-200 bg-rose-50 text-rose-700",
  放弃: "border-stone-200 bg-stone-50 text-stone-500"
};

const priorityStyles: Record<JobPriority, string> = {
  高: "border-rose-200 bg-rose-50 text-rose-700",
  中: "border-amber-200 bg-amber-50 text-amber-700",
  低: "border-slate-200 bg-slate-50 text-slate-600"
};

export function statusTone(status: JobStatus) {
  return statusStyles[status];
}

export function priorityTone(priority: JobPriority) {
  return priorityStyles[priority];
}

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-14 items-center justify-center rounded-full border px-2 text-xs font-medium shadow-sm shadow-slate-100/50",
        statusTone(status)
      )}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: JobPriority }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-10 items-center justify-center rounded-full border px-2 text-xs font-medium shadow-sm shadow-slate-100/50",
        priorityTone(priority)
      )}
    >
      {priority}
    </span>
  );
}
