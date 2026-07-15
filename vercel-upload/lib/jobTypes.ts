export type JobStatus =
  | "收藏"
  | "待投"
  | "已投"
  | "笔试"
  | "面试"
  | "Offer"
  | "拒绝"
  | "放弃";

export type JobPriority = "高" | "中" | "低";

export type TimelineItem = {
  id: string;
  date: string;
  type: "created" | "status_change" | "note" | "follow_up";
  content: string;
};

export type InterviewAiStatus =
  | "empty"
  | "uploaded"
  | "ocr_processing"
  | "ocr_done"
  | "analyzing"
  | "generated"
  | "failed";

export type InterviewScreenshot = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

export type DeepSeekPrep = {
  generatedAt: string;
  readiness: "ready" | "needs_info";
  jdText: string;
  summary: string;
  jdFocus: string[];
  matchPoints: string[];
  gaps: string[];
  unknowns: string[];
  risks: string[];
  actions: string[];
  chatGptBrief: string;
};

export type InterviewPrep = {
  screenshot?: InterviewScreenshot;
  sourceText?: string;
  selectedResumeId?: string;
  candidateContext?: string;
  aiStatus?: InterviewAiStatus;
  aiGeneratedAt?: string;
  aiSource?: "manual" | "deepseek";
  aiError?: string;
  jdText?: string;
  jdAnalysis?: string;
  keyPoints?: string;
  matchAnalysis?: string;
  companyOverview?: string;
  businessProducts?: string;
  selfIntro?: string;
  motivationAnswer?: string;
  hrQuestions?: string;
  resumeQuestions?: string;
  roleQuestions?: string;
  scenarioQuestions?: string;
  reverseQuestions?: string;
  boundaryQuestions?: string;
  englishExcelPrep?: string;
  cheatSheet?: string;
  interviewNotes?: string;
  deepseekPrep?: DeepSeekPrep;
};

export type Job = {
  id: string;
  company: string;
  title: string;
  functionDirection: string;
  industry: string;
  city: string;
  status: JobStatus;
  priority: JobPriority;
  deadline?: string;
  nextAction?: string;
  nextActionDate?: string;
  channel?: string;
  link?: string;
  notes?: string;
  jdText?: string;
  interviewPrep?: InterviewPrep;
  timeline: TimelineItem[];
  createdAt: string;
  updatedAt: string;
};

export type ResumeParseStatus =
  | "pending"
  | "parsed"
  | "manual_required"
  | "failed";

export type ResumeFileType = "pdf" | "doc" | "docx" | "unknown";

export type ResumeProfile = {
  id: string;
  name: string;
  fileName: string;
  fileType: ResumeFileType;
  fileSize: number;
  uploadedAt: string;
  updatedAt: string;
  extractedText: string;
  parseStatus: ResumeParseStatus;
  isDefault: boolean;
  notes?: string;
};

export type JobView =
  | "all"
  | "today"
  | "upcoming"
  | "high"
  | "interview"
  | "waiting"
  | "done";

export type ReminderLabel =
  | "已逾期"
  | "今日处理"
  | "明天截止"
  | "即将截止"
  | "面试准备"
  | "等待反馈"
  | "已结束"
  | "—";

export type ColumnKey =
  | "company"
  | "title"
  | "functionDirection"
  | "industry"
  | "city"
  | "status"
  | "priority"
  | "deadline"
  | "nextAction"
  | "nextActionDate"
  | "reminder"
  | "channel"
  | "link"
  | "interview"
  | "notes";

export type SortDirection = "asc" | "desc";

export type SortState = {
  key: ColumnKey;
  direction: SortDirection;
} | null;

export type TextColumnFilter = {
  type: "text";
  value: string;
};

export type MultiColumnFilter = {
  type: "multi";
  values: string[];
};

export type DateColumnFilter = {
  type: "date";
  from: string;
  to: string;
};

export type LinkColumnFilter = {
  type: "link";
  mode: "has" | "empty" | "";
};

export type ColumnFilter =
  | TextColumnFilter
  | MultiColumnFilter
  | DateColumnFilter
  | LinkColumnFilter;

export type ColumnFilters = Partial<Record<ColumnKey, ColumnFilter>>;
