import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readJobsFromDatabase, writeJobsToDatabase } from "@/lib/jobDatabase";
import { isValidSyncSecret, jobSyncCookieName } from "@/lib/jobSyncAuth";
import type { Job } from "@/lib/jobTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isJobList(value: unknown): value is Job[] {
  return (
    Array.isArray(value) &&
    value.length <= 2000 &&
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

async function isAuthorized() {
  const cookieStore = await cookies();
  return isValidSyncSecret(cookieStore.get(jobSyncCookieName)?.value);
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "当前浏览器尚未启用云端同步。" }, { status: 401 });
  }

  try {
    const data = await readJobsFromDatabase();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取云端数据失败。";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "当前浏览器尚未启用云端同步。" }, { status: 401 });
  }

  let body: { jobs?: unknown };
  try {
    body = (await request.json()) as { jobs?: unknown };
  } catch {
    return NextResponse.json({ error: "提交的数据格式无效。" }, { status: 400 });
  }

  if (!isJobList(body.jobs)) {
    return NextResponse.json({ error: "投递记录格式无效。" }, { status: 400 });
  }

  try {
    const updatedAt = await writeJobsToDatabase(body.jobs);
    return NextResponse.json({ jobs: body.jobs, updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "写入云端数据失败。";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}


