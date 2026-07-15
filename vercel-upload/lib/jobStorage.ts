import type { Job } from "@/lib/jobTypes";
import initialJobs from "@/lib/initialJobs.json";

const storageKey = "autumn_job_tracker_jobs_v1";

function createInitialJobs() {
  return structuredClone(initialJobs) as Job[];
}

function isBrowser() {
  return typeof window !== "undefined";
}

function isJobList(value: unknown): value is Job[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const job = item as Partial<Job>;
      return (
        typeof job.id === "string" &&
        typeof job.company === "string" &&
        typeof job.title === "string" &&
        typeof job.status === "string" &&
        Array.isArray(job.timeline)
      );
    })
  );
}

export function loadJobs() {
  if (!isBrowser()) {
    return createInitialJobs();
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return createInitialJobs();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isJobList(parsed) ? parsed : createInitialJobs();
  } catch {
    return createInitialJobs();
  }
}

export function saveJobs(jobs: Job[]) {
  if (isBrowser()) {
    window.localStorage.setItem(storageKey, JSON.stringify(jobs));
  }
}

export function clearStoredJobs() {
  if (isBrowser()) {
    window.localStorage.removeItem(storageKey);
  }
}
