"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JobDrawer } from "@/components/JobDrawer";
import { JobAiTools, type ParsedJobDraft } from "@/components/JobAiTools";
import { JobTable } from "@/components/JobTable";
import { JobToolbar } from "@/components/JobToolbar";
import { ResumeFolder } from "@/components/resume/ResumeFolder";
import { StatCards } from "@/components/StatCards";
import { ViewTabs } from "@/components/ViewTabs";
import { exportJobsToExcel } from "@/lib/excelExport";
import { filterJobs, getViewCounts, hasActiveColumnFilters } from "@/lib/jobFilters";
import { clearStoredJobs } from "@/lib/jobStorage";
import type { ColumnFilter, ColumnFilters, ColumnKey, Job, JobView, SortState, TimelineItem } from "@/lib/jobTypes";
import { createEmptyJob, createSampleJobs } from "@/lib/sampleJobs";
import { useSyncedJobs } from "@/lib/useSyncedJobs";
import { cn } from "@/lib/utils";

export function JobBoardPage() {
  const { jobs, setJobs, loaded, syncStatus } = useSyncedJobs();
  const [view, setView] = useState<JobView>("all");
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [sort, setSort] = useState<SortState>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [focusJobId, setFocusJobId] = useState<string>();
  const [toast, setToast] = useState("");
  const [aiToolMode, setAiToolMode] = useState<"import" | "review" | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);

    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  const updateJob = useCallback((jobId: string, patch: Partial<Job>) => {
    setJobs((currentJobs) =>
      currentJobs.map((job) => {
        if (job.id !== jobId) {
          return job;
        }

        const now = new Date().toISOString();
        let timeline = job.timeline;

        if (patch.status && patch.status !== job.status) {
          const item: TimelineItem = {
            id: crypto.randomUUID(),
            date: now,
            type: "status_change",
            content: `状态更新为 ${patch.status}`
          };
          timeline = [...job.timeline, item];
        }

        return {
          ...job,
          ...patch,
          timeline,
          updatedAt: now
        };
      })
    );
  }, []);

  function addJob() {
    const nextJob = createEmptyJob();
    setJobs((currentJobs) => [nextJob, ...currentJobs]);
    setView("all");
    setSearch("");
    setColumnFilters({});
    setSort(null);
    setSelectedId(nextJob.id);
    setFocusJobId(nextJob.id);
    showToast("已新增一条岗位。");
  }

  function addParsedJob(draft: ParsedJobDraft) {
    const nextJob = {
      ...createEmptyJob(),
      ...draft,
      status: "待投" as const,
      priority: "中" as const,
      nextAction: "核对岗位信息并投递"
    };

    setJobs((currentJobs) => [nextJob, ...currentJobs]);
    setView("all");
    setSearch("");
    setColumnFilters({});
    setSort(null);
    setSelectedId(nextJob.id);
    setFocusJobId(undefined);
    setAiToolMode(null);
    showToast("岗位截图已识别并加入投递表，请核对详情。");
  }

  function deleteSelectedJob() {
    if (!selectedId) {
      return;
    }

    deleteJobById(selectedId);
  }

  function deleteJobById(jobId: string) {
    setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId));

    if (selectedId === jobId) {
      setSelectedId(undefined);
    }

    if (focusJobId === jobId) {
      setFocusJobId(undefined);
    }

    showToast("岗位已删除。");
  }

  function resetSamples() {
    clearStoredJobs();
    setJobs(createSampleJobs());
    setSearch("");
    setColumnFilters({});
    setSort(null);
    setView("all");
    setSelectedId(undefined);
    showToast("示例数据已重置。");
  }

  function updateColumnFilter(key: ColumnKey, filter?: ColumnFilter) {
    setColumnFilters((current) => {
      const next = { ...current };

      if (!filter) {
        delete next[key];
      } else {
        next[key] = filter;
      }

      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setView("all");
    setColumnFilters({});
    setSort(null);
    showToast("筛选和排序已清空。");
  }

  function exportJobs() {
    if (jobs.length === 0) {
      showToast("当前没有可导出的岗位。");
      return;
    }

    exportJobsToExcel(jobs);
    showToast(`已导出 ${jobs.length} 条岗位。`);
  }

  function reorderVisibleJobs(draggedId: string, targetId: string) {
    if (draggedId === targetId) {
      return;
    }

    const visibleIds = filteredJobs.map((job) => job.id);
    const fromIndex = visibleIds.indexOf(draggedId);
    const toIndex = visibleIds.indexOf(targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const nextVisibleIds = [...visibleIds];
    const [movedId] = nextVisibleIds.splice(fromIndex, 1);
    nextVisibleIds.splice(toIndex, 0, movedId);

    setJobs((currentJobs) => {
      const visibleSet = new Set(nextVisibleIds);
      const currentById = new Map(currentJobs.map((job) => [job.id, job]));
      let cursor = 0;

      return currentJobs.map((job) => {
        if (!visibleSet.has(job.id)) {
          return job;
        }

        const nextJob = currentById.get(nextVisibleIds[cursor]);
        cursor += 1;
        return nextJob ?? job;
      });
    });

    if (sort) {
      setSort(null);
      showToast("已切换为手动排序。");
    } else {
      showToast("岗位顺序已调整。");
    }
  }

  const counts = useMemo(() => getViewCounts(jobs), [jobs]);
  const filteredJobs = useMemo(
    () => filterJobs(jobs, view, search, columnFilters, sort),
    [jobs, view, search, columnFilters, sort]
  );
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedId),
    [jobs, selectedId]
  );
  const hasActiveFilters =
    Boolean(search.trim()) || view !== "all" || hasActiveColumnFilters(columnFilters) || Boolean(sort);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        正在打开投递表...
      </main>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      <main
        className={cn(
          "mx-auto flex min-h-screen max-w-[1680px] flex-col gap-4 px-4 py-4 sm:px-6 lg:py-6",
          selectedJob && "xl:pr-[444px]"
        )}
      >
        <JobToolbar
          search={search}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearch}
          onAdd={addJob}
          onSmartImport={() => setAiToolMode("import")}
          onReview={() => setAiToolMode("review")}
          onExport={exportJobs}
          onReset={resetSamples}
          onClearFilters={clearFilters}
        />

        <StatCards
          total={jobs.length}
          today={counts.today}
          upcoming={counts.upcoming}
          interview={counts.interview}
        />

        <ResumeFolder onMessage={showToast} />

        <section className="flex flex-1 flex-col gap-3">
          <ViewTabs value={view} counts={counts} onChange={setView} />
          <JobTable
            jobs={filteredJobs}
            selectedId={selectedId}
            focusJobId={focusJobId}
            sort={sort}
            filters={columnFilters}
            onFocused={() => setFocusJobId(undefined)}
            onSelect={setSelectedId}
            onUpdate={updateJob}
            onSortChange={setSort}
            onFilterChange={updateColumnFilter}
            onReorder={reorderVisibleJobs}
            onDelete={deleteJobById}
            onToast={showToast}
          />
        </section>
      </main>

      <JobDrawer
        job={selectedJob}
        onClose={() => setSelectedId(undefined)}
        onUpdate={(patch) => selectedId && updateJob(selectedId, patch)}
        onDelete={deleteSelectedJob}
        onToast={showToast}
      />

      <JobAiTools
        mode={aiToolMode}
        jobs={jobs}
        onClose={() => setAiToolMode(null)}
        onAdd={addParsedJob}
        onMessage={showToast}
      />

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,0.15)] backdrop-blur">
          {toast}
        </div>
      ) : null}

      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm backdrop-blur"
      >
        {syncStatus === "checking" ? "正在检查云端数据…" : null}
        {syncStatus === "saving" ? "正在保存到云端…" : null}
        {syncStatus === "saved" ? "已保存到云端" : null}
        {syncStatus === "local" ? "已保存到本机" : null}
        {syncStatus === "error" ? "云端暂不可用，已保存到本机" : null}
      </div>
    </div>
  );
}
