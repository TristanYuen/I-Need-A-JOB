import type { Job } from "@/lib/jobTypes";

export type JobSyncStatus = "checking" | "saving" | "saved" | "local" | "error";

type CloudJobsPayload = {
  jobs: Job[] | null;
  updatedAt?: string;
};

export class CloudEncodingDamageError extends Error {}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as CloudJobsPayload & { error?: string };

  if (response.status === 400 && payload.error?.includes("编码损坏")) {
    throw new CloudEncodingDamageError(payload.error);
  }

  if (!response.ok) {
    throw new Error(payload.error || "云端保存暂时不可用。");
  }

  return payload;
}

export async function fetchCloudJobs(signal?: AbortSignal) {
  const response = await fetch("/api/jobs", {
    method: "GET",
    cache: "no-store",
    signal
  });

  return parseResponse(response);
}

export async function saveCloudJobs(jobs: Job[]) {
  const response = await fetch("/api/jobs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobs })
  });

  return parseResponse(response);
}
