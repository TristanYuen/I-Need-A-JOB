import type { ColumnKey, Job, ReminderLabel, SortDirection, SortState } from "@/lib/jobTypes";

const statusOrder = ["收藏", "待投", "已投", "笔试", "面试", "Offer", "拒绝", "放弃"];
const priorityOrder = ["高", "中", "低"];
const reminderOrder: ReminderLabel[] = [
  "已逾期",
  "今日处理",
  "明天截止",
  "即将截止",
  "面试准备",
  "等待反馈",
  "已结束",
  "—"
];

const closedStatuses = new Set(["Offer", "拒绝", "放弃"]);
const waitingStatuses = new Set(["已投", "笔试", "面试"]);

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

function dateTime(value?: string) {
  const date = parseLocalDate(value);
  return date ? date.getTime() : Number.POSITIVE_INFINITY;
}

function hasInterviewPrep(job: Job) {
  const prep = job.interviewPrep;

  if (!prep) {
    return false;
  }

  return [
    prep.jdText,
    prep.keyPoints,
    prep.companyOverview,
    prep.businessProducts,
    prep.selfIntro,
    prep.resumeQuestions,
    prep.roleQuestions,
    prep.reverseQuestions,
    prep.interviewNotes
  ].some((value) => Boolean(value?.trim()));
}

export function getReminderLabel(job: Job): ReminderLabel {
  const today = startOfDay(new Date()).getTime();
  const tomorrow = today + 24 * 60 * 60 * 1000;
  const sevenDaysLater = today + 7 * 24 * 60 * 60 * 1000;
  const nextActionTime = parseLocalDate(job.nextActionDate)?.getTime();
  const deadlineTime = parseLocalDate(job.deadline)?.getTime();

  if (nextActionTime && nextActionTime < today && !closedStatuses.has(job.status)) {
    return "已逾期";
  }

  if (nextActionTime === today && !closedStatuses.has(job.status)) {
    return "今日处理";
  }

  if (deadlineTime === tomorrow && ["收藏", "待投"].includes(job.status)) {
    return "明天截止";
  }

  if (
    deadlineTime &&
    deadlineTime >= today &&
    deadlineTime <= sevenDaysLater &&
    ["收藏", "待投"].includes(job.status)
  ) {
    return "即将截止";
  }

  if (job.status === "面试") {
    return "面试准备";
  }

  if (waitingStatuses.has(job.status)) {
    return "等待反馈";
  }

  if (closedStatuses.has(job.status)) {
    return "已结束";
  }

  return "—";
}

function getSortableValue(job: Job, key: ColumnKey) {
  switch (key) {
    case "status":
      return statusOrder.indexOf(job.status);
    case "priority":
      return priorityOrder.indexOf(job.priority);
    case "deadline":
      return dateTime(job.deadline);
    case "nextActionDate":
      return dateTime(job.nextActionDate);
    case "reminder":
      return reminderOrder.indexOf(getReminderLabel(job));
    case "link":
      return job.link ? 0 : 1;
    case "interview":
      return hasInterviewPrep(job) ? 0 : 1;
    case "company":
    case "title":
    case "functionDirection":
    case "industry":
    case "city":
    case "nextAction":
    case "channel":
    case "notes":
      return (job[key] ?? "").toString().toLocaleLowerCase("zh-CN");
    default:
      return "";
  }
}

export function compareJobs(a: Job, b: Job, key: ColumnKey, direction: SortDirection) {
  const aValue = getSortableValue(a, key);
  const bValue = getSortableValue(b, key);
  const multiplier = direction === "asc" ? 1 : -1;

  if (typeof aValue === "number" && typeof bValue === "number") {
    return (aValue - bValue) * multiplier;
  }

  return String(aValue).localeCompare(String(bValue), "zh-CN") * multiplier;
}

export function sortJobs(jobs: Job[], sort: SortState) {
  if (!sort) {
    return jobs;
  }

  return [...jobs].sort((a, b) => compareJobs(a, b, sort.key, sort.direction));
}

export function getColumnValue(job: Job, key: ColumnKey) {
  if (key === "reminder") {
    return getReminderLabel(job);
  }

  if (key === "interview") {
    return hasInterviewPrep(job) ? "已填写" : "待准备";
  }

  return String(job[key as keyof Job] ?? "");
}

export const reminderOptions = reminderOrder;
