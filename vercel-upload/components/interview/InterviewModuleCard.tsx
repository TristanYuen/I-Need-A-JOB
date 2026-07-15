import Link from "next/link";
import type { InterviewModule } from "@/lib/interviewModules";

export function InterviewModuleCard({
  jobId,
  module,
  complete
}: {
  jobId: string;
  module: InterviewModule;
  complete: boolean;
}) {
  return (
    <article className="flex min-h-44 flex-col justify-between rounded-3xl border border-white/70 bg-white/78 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_18px_60px_rgba(79,70,229,0.12)]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-950">{module.title}</h3>
          <span className={complete ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700" : "rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500"}>
            {complete ? "已填写" : "待准备"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">{module.description}</p>
      </div>
      <Link
        href={`/interview/${jobId}/${module.id}`}
        className="mt-5 inline-flex h-10 w-fit items-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-indigo-600"
      >
        进入
      </Link>
    </article>
  );
}
