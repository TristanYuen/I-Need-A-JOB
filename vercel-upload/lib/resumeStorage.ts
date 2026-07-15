import type { ResumeFileType, ResumeProfile } from "@/lib/jobTypes";
import initialResumes from "@/lib/initialResumes.json";

const resumeStorageKey = "autumn_job_tracker_resumes_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function createInitialResumes() {
  return structuredClone(initialResumes) as ResumeProfile[];
}

function normalizeResumes(resumes: ResumeProfile[]) {
  if (resumes.length === 0) {
    return [];
  }

  const hasDefault = resumes.some((resume) => resume.isDefault);

  if (hasDefault) {
    let defaultSeen = false;
    return resumes.map((resume) => {
      if (!resume.isDefault) {
        return resume;
      }

      if (defaultSeen) {
        return { ...resume, isDefault: false };
      }

      defaultSeen = true;
      return resume;
    });
  }

  return resumes.map((resume, index) => ({ ...resume, isDefault: index === 0 }));
}

function isResumeList(value: unknown): value is ResumeProfile[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const resume = item as Partial<ResumeProfile>;
      return (
        typeof resume.id === "string" &&
        typeof resume.name === "string" &&
        typeof resume.fileName === "string" &&
        typeof resume.extractedText === "string" &&
        typeof resume.uploadedAt === "string"
      );
    })
  );
}

export function getResumeFileType(fileName: string): ResumeFileType {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf" || extension === "doc" || extension === "docx") {
    return extension;
  }

  return "unknown";
}

export function getResumes() {
  if (!isBrowser()) {
    return createInitialResumes();
  }

  const raw = window.localStorage.getItem(resumeStorageKey);

  if (!raw) {
    return createInitialResumes();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isResumeList(parsed) ? normalizeResumes(parsed) : createInitialResumes();
  } catch {
    return createInitialResumes();
  }
}

export function saveResumes(resumes: ResumeProfile[]) {
  if (isBrowser()) {
    window.localStorage.setItem(resumeStorageKey, JSON.stringify(normalizeResumes(resumes)));
  }
}

export function addResume(resume: ResumeProfile) {
  const resumes = getResumes();
  const next = normalizeResumes([
    ...resumes.map((item) => (resume.isDefault ? { ...item, isDefault: false } : item)),
    resume
  ]);
  saveResumes(next);
  return next;
}

export function updateResume(id: string, patch: Partial<ResumeProfile>) {
  const next = normalizeResumes(
    getResumes().map((resume) =>
      resume.id === id ? { ...resume, ...patch, updatedAt: new Date().toISOString() } : resume
    )
  );
  saveResumes(next);
  return next;
}

export function deleteResume(id: string) {
  const next = normalizeResumes(getResumes().filter((resume) => resume.id !== id));
  saveResumes(next);
  return next;
}

export function setDefaultResume(id: string) {
  const next = normalizeResumes(
    getResumes().map((resume) => ({ ...resume, isDefault: resume.id === id }))
  );
  saveResumes(next);
  return next;
}

export function getDefaultResume() {
  return getResumes().find((resume) => resume.isDefault);
}

export function getResumeById(id: string) {
  return getResumes().find((resume) => resume.id === id);
}
