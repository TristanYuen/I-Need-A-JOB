import { timingSafeEqual } from "node:crypto";

export const jobSyncCookieName = "job_sync_session";

export function isValidSyncSecret(value?: string) {
  const expected = process.env.JOB_SYNC_SECRET;
  if (!expected || !value) {
    return false;
  }

  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}


