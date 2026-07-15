"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  CloudSyncUnauthorizedError,
  fetchCloudJobs,
  saveCloudJobs,
  type JobSyncStatus
} from "@/lib/jobCloudSync";
import { hasPendingJobSync, loadJobs, markJobsSynced, saveJobs } from "@/lib/jobStorage";
import type { Job } from "@/lib/jobTypes";

const saveDelayMs = 700;

export function useSyncedJobs() {
  const [jobs, setJobsState] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<JobSyncStatus>("checking");
  const latestJobsRef = useRef<Job[]>([]);
  const revisionRef = useRef(0);
  const cloudEnabledRef = useRef(false);
  const initializedRef = useRef(false);
  const applyingCloudRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const setJobs: Dispatch<SetStateAction<Job[]>> = useCallback((action) => {
    setJobsState((current) => {
      const next = typeof action === "function" ? action(current) : action;
      latestJobsRef.current = next;
      return next;
    });
  }, []);

  const persistToCloud = useCallback(async (payload: Job[], revision: number) => {
    try {
      setSyncStatus("saving");
      await saveCloudJobs(payload);

      if (revision === revisionRef.current) {
        markJobsSynced();
        setSyncStatus("saved");
      }
    } catch (error) {
      if (error instanceof CloudSyncUnauthorizedError) {
        cloudEnabledRef.current = false;
        setSyncStatus("local");
      } else {
        setSyncStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const localJobs = loadJobs();
    latestJobsRef.current = localJobs;
    setJobsState(localJobs);
    setLoaded(true);

    async function hydrateFromCloud() {
      try {
        const cloud = await fetchCloudJobs(controller.signal);
        cloudEnabledRef.current = true;

        if (cloud.jobs === null || hasPendingJobSync()) {
          await persistToCloud(latestJobsRef.current, revisionRef.current);
          return;
        }

        applyingCloudRef.current = true;
        latestJobsRef.current = cloud.jobs;
        setJobsState(cloud.jobs);
        saveJobs(cloud.jobs, { markPending: false });
        markJobsSynced();
        setSyncStatus("saved");
      } catch (error) {
        if (error instanceof CloudSyncUnauthorizedError) {
          setSyncStatus("local");
        } else if (!controller.signal.aborted) {
          setSyncStatus("error");
        }
      }
    }

    void hydrateFromCloud();

    return () => {
      controller.abort();
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [persistToCloud]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    if (applyingCloudRef.current) {
      applyingCloudRef.current = false;
      return;
    }

    revisionRef.current += 1;
    const revision = revisionRef.current;
    saveJobs(jobs);

    if (!cloudEnabledRef.current) {
      setSyncStatus((current) => (current === "checking" ? current : "local"));
      return;
    }

    setSyncStatus("saving");
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistToCloud(latestJobsRef.current, revision);
    }, saveDelayMs);
  }, [jobs, loaded, persistToCloud]);

  return { jobs, setJobs, loaded, syncStatus };
}


