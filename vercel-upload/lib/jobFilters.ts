import { viewTabs } from "@/lib/jobOptions";
import { getColumnValue, sortJobs } from "@/lib/jobSorting";
import type { ColumnFilter, ColumnFilters, ColumnKey, Job, JobView, SortState } from "@/lib/jobTypes";

const closedStatuses = new Set(["Offer", "拒绝", "放弃"]);
const waitingStatuses = new Set(["已投", "笔试", "面试"]);
const bottomStatuses = new Set(["拒绝", "放弃"]);

function getOutcomeRank(job: Job) {
  if (job.status === "Offer") {
    return 0;
  }

  if (bottomStatuses.has(job.status)) {
    return 2;
  }

  return 1;
}

function applyOutcomePositioning(jobs: Job[]) {
  return jobs
    .map((job, index) => ({ job, index, rank: getOutcomeRank(job) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ job }) => job);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value?: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

export function isTodayOrOverdue(job: Job) {
  const date = parseLocalDate(job.nextActionDate);

  if (!date || closedStatuses.has(job.status)) {
    return false;
  }

  return startOfDay(date).getTime() <= startOfDay(new Date()).getTime();
}

export function isUpcomingDeadline(job: Job) {
  const date = parseLocalDate(job.deadline);

  if (!date || !["收藏", "待投"].includes(job.status)) {
    return false;
  }

  const today = startOfDay(new Date()).getTime();
  const target = startOfDay(date).getTime();
  const sevenDaysLater = today + 7 * 24 * 60 * 60 * 1000;

  return target >= today && target <= sevenDaysLater;
}

export function matchesView(job: Job, view: JobView) {
  switch (view) {
    case "today":
      return isTodayOrOverdue(job);
    case "upcoming":
      return isUpcomingDeadline(job);
    case "high":
      return job.priority === "高";
    case "interview":
      return job.status === "面试";
    case "waiting":
      return waitingStatuses.has(job.status);
    case "done":
      return closedStatuses.has(job.status);
    case "all":
    default:
      return true;
  }
}

export function matchesSearch(job: Job, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [job.company, job.title, job.city]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

function hasFilterValue(filter: ColumnFilter | undefined) {
  if (!filter) {
    return false;
  }

  if (filter.type === "text") {
    return Boolean(filter.value.trim());
  }

  if (filter.type === "multi") {
    return filter.values.length > 0;
  }

  if (filter.type === "date") {
    return Boolean(filter.from || filter.to);
  }

  return Boolean(filter.mode);
}

function normalizeFilterText(value: string) {
  return value.trim().toLowerCase();
}

export function hasActiveColumnFilters(filters: ColumnFilters) {
  return Object.values(filters).some(hasFilterValue);
}

export function hasActiveColumnFilter(filters: ColumnFilters, key: ColumnKey) {
  return hasFilterValue(filters[key]);
}

function matchesColumnFilter(job: Job, key: ColumnKey, filter: ColumnFilter | undefined) {
  if (!hasFilterValue(filter)) {
    return true;
  }

  const value = getColumnValue(job, key);

  if (filter?.type === "text") {
    const keyword = normalizeFilterText(filter.value);

    return normalizeFilterText(value).includes(keyword);
  }

  if (filter?.type === "multi") {
    return filter.values.includes(value);
  }

  if (filter?.type === "date") {
    const date = parseLocalDate(value);
    const from = parseLocalDate(filter.from);
    const to = parseLocalDate(filter.to);

    if (!date) {
      return false;
    }

    if (from && date.getTime() < from.getTime()) {
      return false;
    }

    if (to && date.getTime() > to.getTime()) {
      return false;
    }

    return true;
  }

  if (filter?.type === "link") {
    if (!filter.mode) {
      return true;
    }

    return filter.mode === "has" ? Boolean(job.link?.trim()) : !job.link?.trim();
  }

  return true;
}

export function applyColumnFilters(jobs: Job[], filters: ColumnFilters) {
  return jobs.filter((job) =>
    Object.entries(filters).every(([key, filter]) =>
      matchesColumnFilter(job, key as ColumnKey, filter)
    )
  );
}

export function filterJobs(
  jobs: Job[],
  view: JobView,
  query: string,
  filters: ColumnFilters = {},
  sort: SortState = null
) {
  const searched = jobs.filter((job) => matchesSearch(job, query));
  const viewed = searched.filter((job) => matchesView(job, view));
  const columnFiltered = applyColumnFilters(viewed, filters);

  return applyOutcomePositioning(sortJobs(columnFiltered, sort));
}

export function getViewCounts(jobs: Job[]) {
  return viewTabs.reduce<Record<JobView, number>>(
    (counts, tab) => {
      counts[tab.id] = jobs.filter((job) => matchesView(job, tab.id)).length;
      return counts;
    },
    { all: 0, today: 0, upcoming: 0, high: 0, interview: 0, waiting: 0, done: 0 }
  );
}
