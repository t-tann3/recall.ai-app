"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateJobPostingPanel } from "@/components/dashboard/CreateJobPostingPanel";
import {
  DashboardPanel,
  InterviewRow,
  JobPostingRow,
} from "@/components/dashboard/HomePanels";
import { useAuth } from "@/lib/AuthProvider";
import {
  listInterviews,
  listJobPostings,
  type InterviewListItem,
  type JobPosting,
} from "@/lib/api/hr";

const UPCOMING = new Set(["scheduled", "joining", "in_call"]);
const PAST = new Set(["ready", "processing", "cancelled", "failed"]);

export default function HomePage() {
  const { hiringManager } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobRows, interviewRows] = await Promise.all([
        listJobPostings(),
        listInterviews(),
      ]);
      setJobs(jobRows);
      setInterviews(interviewRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      interviews
        .filter((item) => item?.interview && UPCOMING.has(item.interview.status))
        .sort((a, b) =>
          String(a.interview.scheduledAt || "").localeCompare(
            String(b.interview.scheduledAt || ""),
          ),
        ),
    [interviews],
  );

  const past = useMemo(
    () =>
      interviews
        .filter((item) => item?.interview && PAST.has(item.interview.status))
        .sort((a, b) =>
          String(b.interview.scheduledAt || b.interview.updatedAt).localeCompare(
            String(a.interview.scheduledAt || a.interview.updatedAt),
          ),
        ),
    [interviews],
  );

  const openJobs = useMemo(
    () => jobs.filter((j) => j.status === "open" || j.status === "draft"),
    [jobs],
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-recall-muted">
            Hiring home
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-recall-navy md:text-3xl">
            Welcome{hiringManager?.name ? `, ${hiringManager.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-recall-muted">
            Track upcoming interviews, manage open roles, and review past conversations —
            all in one place.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="border border-recall-border bg-white px-3 py-1.5 font-medium text-recall-navy">
            {upcoming.length} upcoming
          </span>
          <span className="border border-recall-border bg-white px-3 py-1.5 font-medium text-recall-navy">
            {openJobs.length} open roles
          </span>
          <span className="border border-recall-border bg-white px-3 py-1.5 font-medium text-recall-navy">
            {past.length} past
          </span>
        </div>
      </div>

      <CreateJobPostingPanel
        onCreated={(job) => {
          setJobs((prev) => [job, ...prev]);
        }}
      />

      {error ? (
        <p className="mt-6 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-recall-muted">Loading your hiring dashboard…</p>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <DashboardPanel
            eyebrow="Schedule"
            title="Upcoming Interviews"
            count={upcoming.length}
            accent="blue"
            empty="No upcoming interviews. Schedule one against an open role."
          >
            {upcoming.map((item) => (
              <InterviewRow key={item.interview.id} item={item} />
            ))}
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Roles"
            title="Job Postings"
            count={openJobs.length}
            accent="violet"
            empty="No open job postings yet. Create one above."
          >
            {openJobs.map((job) => (
              <JobPostingRow key={job.id} job={job} />
            ))}
          </DashboardPanel>

          <DashboardPanel
            eyebrow="History"
            title="Past Interviews"
            count={past.length}
            accent="navy"
            empty="Completed interviews will show up here after the call."
          >
            {past.map((item) => (
              <InterviewRow key={item.interview.id} item={item} />
            ))}
          </DashboardPanel>
        </div>
      )}
    </div>
  );
}
