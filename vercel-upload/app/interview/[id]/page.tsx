"use client";

import { useParams } from "next/navigation";
import { InterviewHubPage } from "@/components/interview/InterviewHubPage";

export default function Page() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  return <InterviewHubPage jobId={id} />;
}
