import type { Job } from "@/lib/jobTypes";
import initialJobs from "@/lib/initialJobs.json";

const storageKey = "autumn_job_tracker_jobs_v1";
const seedVersionKey = "autumn_job_tracker_seed_version";
const pendingSyncKey = "autumn_job_tracker_pending_sync_v1";
const seedVersion = "2026-07-16-six-jobs";

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

function mergeMissingSeedJobs(storedJobs: Job[]) {
  const seedJobs = createInitialJobs();
  const existingKeys = new Set(
    storedJobs.map((job) => `${job.company.trim()}\u0000${job.title.trim()}\u0000${job.deadline ?? ""}`)
  );
  const missingJobs = seedJobs.filter(
    (job) => !existingKeys.has(`${job.company.trim()}\u0000${job.title.trim()}\u0000${job.deadline ?? ""}`)
  );

  return missingJobs.length ? [...missingJobs, ...storedJobs] : storedJobs;
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
    if (!isJobList(parsed)) {
      return createInitialJobs();
    }

    if (window.localStorage.getItem(seedVersionKey) !== seedVersion) {
      const migrated = mergeMissingSeedJobs(parsed);
      window.localStorage.setItem(storageKey, JSON.stringify(migrated));
      window.localStorage.setItem(seedVersionKey, seedVersion);
      return migrated;
    }

    return parsed;
  } catch {
    return createInitialJobs();
  }
}

export function saveJobs(jobs: Job[], options: { markPending?: boolean } = {}) {
  if (isBrowser()) {
    window.localStorage.setItem(storageKey, JSON.stringify(jobs));
    if (options.markPending !== false) {
      window.localStorage.setItem(pendingSyncKey, "1");
    }
  }
}

export function hasPendingJobSync() {
  return isBrowser() && window.localStorage.getItem(pendingSyncKey) === "1";
}

export function markJobsSynced() {
  if (isBrowser()) {
    window.localStorage.removeItem(pendingSyncKey);
  }
}

export function clearStoredJobs() {
  if (isBrowser()) {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(seedVersionKey);
    window.localStorage.removeItem(pendingSyncKey);
  }
}

