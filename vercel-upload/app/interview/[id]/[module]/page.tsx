"use client";

import { useParams } from "next/navigation";
import { InterviewModulePage } from "@/components/interview/InterviewModulePage";

export default function Page() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const moduleId = Array.isArray(params.module) ? params.module[0] : params.module ?? "";

  return <InterviewModulePage jobId={id} moduleId={moduleId} />;
}
