import { neon } from "@neondatabase/serverless";
import type { Job } from "@/lib/jobTypes";

let initialized = false;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("云端数据库尚未连接。");
  }

  return neon(databaseUrl);
}

async function ensureTable() {
  if (initialized) {
    return;
  }

  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS job_assistant_state (
      id TEXT PRIMARY KEY,
      jobs JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  initialized = true;
}

export async function readJobsFromDatabase() {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    SELECT jobs, updated_at
    FROM job_assistant_state
    WHERE id = 'default'
    LIMIT 1
  `;

  if (!rows.length) {
    return { jobs: null, updatedAt: undefined };
  }

  return {
    jobs: rows[0].jobs as Job[],
    updatedAt: new Date(rows[0].updated_at as string | Date).toISOString()
  };
}

export async function writeJobsToDatabase(jobs: Job[]) {
  await ensureTable();
  const sql = getSql();
  const payload = JSON.stringify(jobs);
  const rows = await sql`
    INSERT INTO job_assistant_state (id, jobs, updated_at)
    VALUES ('default', ${payload}::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET jobs = EXCLUDED.jobs, updated_at = NOW()
    RETURNING updated_at
  `;

  return new Date(rows[0].updated_at as string | Date).toISOString();
}


