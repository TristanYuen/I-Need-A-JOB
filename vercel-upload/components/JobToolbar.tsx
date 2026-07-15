import Link from "next/link";

type JobToolbarProps = {
  search: string;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onSmartImport: () => void;
  onReview: () => void;
  onExport: () => void;
  onReset: () => void;
  onClearFilters: () => void;
};

export function JobToolbar({
  search,
  hasActiveFilters,
  onSearchChange,
  onAdd,
  onSmartImport,
  onReview,
  onExport,
  onReset,
  onClearFilters
}: JobToolbarProps) {
  return (
    <header className="rounded-3xl border border-white/70 bg-white/75 px-5 py-5 shadow-[0_24px_80px_rgba(79,70,229,0.12)] backdrop-blur sm:px-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              秋招工作台
            </span>
            <button
              type="button"
              onClick={onReset}
              className="h-8 rounded-full border border-slate-200/80 bg-white/80 px-3 text-xs font-medium text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              重置示例数据
            </button>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
            秋招投递表
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            管理岗位、投递日期、下一步动作和面试准备
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto">
          <label className="relative min-w-0 flex-1 xl:w-[420px]">
            <span className="sr-only">搜索</span>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索公司 / 岗位名称 / 城市"
              className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button
              type="button"
              onClick={onAdd}
              className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500"
            >
              新增岗位
            </button>
            <button
              type="button"
              onClick={onSmartImport}
              className="h-10 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              智能录入
            </button>
            <button
              type="button"
              onClick={onReview}
              className="h-10 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              求职复盘
            </button>
            <button
              type="button"
              onClick={onExport}
              className="h-10 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              导出数据
            </button>
            <button
              type="button"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="h-10 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              清空筛选
            </button>
            <Link
              href="/settings"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              设置
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
