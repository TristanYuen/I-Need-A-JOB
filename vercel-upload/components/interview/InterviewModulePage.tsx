"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AutoSaveTextarea } from "@/components/interview/AutoSaveTextarea";
import { InterviewTopBar } from "@/components/interview/InterviewTopBar";
import { getInterviewModule } from "@/lib/interviewModules";
import type { InterviewPrepField } from "@/lib/interviewModules";
import { getInterviewPrep } from "@/lib/interviewPrep";
import { loadJobs, saveJobs } from "@/lib/jobStorage";
import type { InterviewPrep, Job } from "@/lib/jobTypes";

export function InterviewModulePage({ jobId, moduleId }: { jobId: string; moduleId: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setJobs(loadJobs());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveJobs(jobs);
    }
  }, [jobs, loaded]);

  const job = useMemo(() => jobs.find((item) => item.id === jobId), [jobs, jobId]);
  const module = getInterviewModule(moduleId);
  const prep = job ? getInterviewPrep(job) : undefined;

  function updateJob(patch: Partial<Job>) {
    setJobs((currentJobs) =>
      currentJobs.map((item) =>
        item.id === jobId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    );
  }

  function updatePrepField(key: InterviewPrepField, value: string) {
    setJobs((currentJobs) =>
      currentJobs.map((item) => {
        if (item.id !== jobId) {
          return item;
        }

        const nextPrep: InterviewPrep = {
          ...getInterviewPrep(item),
          [key]: value,
          aiSource: "manual"
        };

        return {
          ...item,
          jdText: key === "jdText" ? value : item.jdText,
          interviewPrep: nextPrep,
          updatedAt: new Date().toISOString()
        };
      })
    );
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        正在打开准备模块...
      </main>
    );
  }

  if (!job || !prep || !module) {
    return (
      <main className="min-h-screen px-4 py-8 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white/80 px-6 py-8 shadow-sm backdrop-blur">
          <h1 className="text-xl font-semibold tracking-normal text-slate-950">
            {!job ? "未找到岗位" : "未找到模块"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">请返回投递表重新进入面试准备。</p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            返回投递表
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <InterviewTopBar
          job={job}
          subtitle={module.title}
          backHref={`/interview/${job.id}`}
          backLabel="面试准备中心"
          onUpdate={updateJob}
        />

        <section className="grid gap-4">
          {module.fields.map((field) => (
            <AutoSaveTextarea
              key={field.key}
              label={field.label}
              description={field.description}
              value={prep[field.key]}
              rows={field.rows}
              onChange={(value) => updatePrepField(field.key, value)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
