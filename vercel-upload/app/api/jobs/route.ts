import { NextResponse } from "next/server";
import { readJobsFromDatabase, writeJobsToDatabase } from "@/lib/jobDatabase";
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

function containsEncodingDamage(value: unknown): boolean {
  if (typeof value === "string") {
    return /[\u0080-\u009f\ufffd]/.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(containsEncodingDamage);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(containsEncodingDamage);
  }

  return false;
}

export async function GET() {
  try {
    const data = await readJobsFromDatabase();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取云端数据失败。";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  let body: { jobs?: unknown };
  try {
    body = (await request.json()) as { jobs?: unknown };
  } catch {
    return NextResponse.json({ error: "提交的数据格式无效。" }, { status: 400 });
  }

  if (!isJobList(body.jobs)) {
    return NextResponse.json({ error: "投递记录格式无效。" }, { status: 400 });
  }

  if (containsEncodingDamage(body.jobs)) {
    return NextResponse.json(
      { error: "检测到文本编码损坏，已拒绝覆盖云端数据。请刷新页面后重试。" },
      { status: 400 }
    );
  }

  try {
    const updatedAt = await writeJobsToDatabase(body.jobs);
    return NextResponse.json({ jobs: body.jobs, updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "写入云端数据失败。";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
