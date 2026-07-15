import { viewTabs } from "@/lib/jobOptions";
import type { JobView } from "@/lib/jobTypes";
import { cn } from "@/lib/utils";

type ViewTabsProps = {
  value: JobView;
  counts: Record<JobView, number>;
  onChange: (view: JobView) => void;
};

export function ViewTabs({ value, counts, onChange }: ViewTabsProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/70 bg-white/60 px-2 py-2 shadow-sm backdrop-blur">
      <div className="flex min-w-max gap-1">
        {viewTabs.map((tab) => {
          const active = tab.id === value;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                active
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
