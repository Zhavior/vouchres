import { useEffect, useMemo, useRef, useState } from "react";
import { vouchEdgeBootJobs, type VouchEdgeBootJob } from "../lib/boot/bootJobs";

type BootJobStatus = "pending" | "running" | "success" | "error" | "timeout";

export type VouchEdgeBootState = {
  ready: boolean;
  progress: number;
  status: string;
  activeFeature: string;
  completed: number;
  total: number;
  requiredDone: boolean;
  timedOut: boolean;
  jobs: Record<string, BootJobStatus>;
};

const MIN_BOOT_MS = 1800;
const MAX_BOOT_MS = 8000;

function runWithTimeout(job: VouchEdgeBootJob, signal: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`Boot job timed out: ${job.id}`));
    }, job.timeoutMs);

    job.run(signal)
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeout));
  });
}

export function useVouchEdgeBoot(enabled = true): VouchEdgeBootState {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Preparing VouchEdge Island");
  const [activeFeature, setActiveFeature] = useState("Command Center");
  const [completed, setCompleted] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [jobs, setJobs] = useState<Record<string, BootJobStatus>>(() =>
    Object.fromEntries(vouchEdgeBootJobs.map((job) => [job.id, "pending"]))
  );

  const startedAtRef = useRef(0);

  const total = vouchEdgeBootJobs.length;

  const requiredWeight = useMemo(
    () => vouchEdgeBootJobs.filter((job) => job.required).reduce((sum, job) => sum + job.weight, 0),
    []
  );

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    startedAtRef.current = Date.now();

    async function runBoot() {
      let weightedProgress = 0;
      let requiredProgress = 0;
      let completedCount = 0;

      const maxTimer = window.setTimeout(() => {
        if (cancelled) return;
        setTimedOut(true);
        setStatus("Entering Island while deeper intelligence keeps warming");
        setProgress((current) => Math.max(current, 96));
      }, MAX_BOOT_MS);

      const runJob = async (job: VouchEdgeBootJob) => {
        if (cancelled) return;

        setJobs((current) => ({ ...current, [job.id]: "running" }));
        setStatus(job.label);
        setActiveFeature(job.feature);

        try {
          await runWithTimeout(job, controller.signal);

          if (cancelled) return;

          weightedProgress += job.weight;
          if (job.required) requiredProgress += job.weight;
          completedCount += 1;

          setCompleted(completedCount);
          setProgress(Math.min(96, Math.round(weightedProgress)));
          setJobs((current) => ({ ...current, [job.id]: "success" }));
        } catch (error) {
          if (cancelled || controller.signal.aborted) return;

          completedCount += 1;
          setCompleted(completedCount);
          setJobs((current) => ({
            ...current,
            [job.id]: error instanceof Error && error.message.includes("timed out") ? "timeout" : "error",
          }));

          if (!job.required) {
            weightedProgress += Math.round(job.weight * 0.5);
            setProgress(Math.min(92, Math.round(weightedProgress)));
          }
        }
      };

      await Promise.all(vouchEdgeBootJobs.map(runJob));

      if (cancelled) return;

      window.clearTimeout(maxTimer);

      const elapsed = Date.now() - startedAtRef.current;
      const remainingPolishTime = Math.max(0, MIN_BOOT_MS - elapsed);

      window.setTimeout(() => {
        if (cancelled) return;

        const requiredDone = requiredProgress >= requiredWeight || Date.now() - startedAtRef.current >= MAX_BOOT_MS;

        setStatus(requiredDone ? "Entering VouchEdge Island" : "Opening Island with live warmup");
        setProgress(100);
        window.setTimeout(() => {
          if (!cancelled) setReady(true);
        }, 300);
      }, remainingPolishTime);
    }

    runBoot();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, requiredWeight]);

  return {
    ready,
    progress,
    status,
    activeFeature,
    completed,
    total,
    requiredDone: ready || progress >= 100,
    timedOut,
    jobs,
  };
}
