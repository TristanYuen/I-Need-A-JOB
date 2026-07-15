import type { InterviewPrep, Job } from "@/lib/jobTypes";
import { createEmptyGeneratedInterviewPrep } from "@/lib/interviewPrepSchema";

export function getInterviewPrep(job: Job): InterviewPrep {
  return {
    sourceText: "",
    candidateContext: "",
    ...createEmptyGeneratedInterviewPrep(),
    jdText: job.interviewPrep?.jdText ?? job.jdText ?? "",
    aiStatus: job.interviewPrep?.screenshot ? "uploaded" : "empty",
    aiSource: "manual",
    ...job.interviewPrep
  };
}

export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function formatUploadedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
