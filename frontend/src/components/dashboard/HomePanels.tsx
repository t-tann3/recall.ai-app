"use client";

import Link from "next/link";
import type { InterviewListItem, JobPosting } from "@/lib/api/hr";

function formatWhen(iso: string | null) {
  if (!iso) return "Unscheduled";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(status: string) {
  switch (status) {
    case "open":
    case "scheduled":
    case "joining":
    case "in_call":
      return "bg-recall-blue/10 text-recall-blue";
    case "ready":
      return "bg-recall-green/15 text-emerald-800";
    case "processing":
      return "bg-amber-100 text-amber-800";
    case "closed":
    case "cancelled":
    case "failed":
      return "bg-neutral-200 text-neutral-700";
    default:
      return "bg-recall-surface text-recall-muted";
  }
}

export function DashboardPanel({
  eyebrow,
  title,
  count,
  accent,
  empty,
  children,
}: {
  eyebrow: string;
  title: string;
  count: number;
  accent: "blue" | "violet" | "navy";
  empty: string;
  children: React.ReactNode;
}) {
  const accents = {
    blue: "from-recall-blue/15 via-white to-white border-recall-blue/20",
    violet: "from-recall-violet/12 via-white to-white border-recall-violet/20",
    navy: "from-recall-navy/10 via-white to-white border-recall-navy/15",
  };

  const bar = {
    blue: "bg-recall-blue",
    violet: "bg-recall-violet",
    navy: "bg-recall-navy",
  };

  return (
    <section
      className={`flex min-h-[320px] flex-col overflow-hidden border bg-gradient-to-b ${accents[accent]} shadow-[0_1px_0_rgba(0,21,53,0.04)]`}
    >
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-recall-muted">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-recall-navy">
            {title}
          </h2>
        </div>
        <span className="flex h-8 min-w-8 items-center justify-center bg-white px-2 text-sm font-semibold text-recall-navy ring-1 ring-recall-border">
          {count}
        </span>
      </div>
      <div className={`mx-5 h-0.5 ${bar[accent]} opacity-80`} />
      <div className="flex-1 overflow-auto p-3">
        {count === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-recall-muted">{empty}</p>
        ) : (
          <ul className="space-y-2">{children}</ul>
        )}
      </div>
    </section>
  );
}

export function InterviewRow({ item }: { item: InterviewListItem }) {
  const { interview, candidate, jobPosting } = item;
  return (
    <li className="border border-recall-border/80 bg-white/90 px-3.5 py-3 transition hover:border-recall-blue/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-recall-navy">
            {candidate?.name || "Candidate"}
          </p>
          <p className="mt-0.5 truncate text-xs text-recall-muted">
            {jobPosting?.title || "Role"} · {interview.type.replace("_", " ")}
          </p>
          <p className="mt-1 text-[11px] text-recall-muted">
            {formatWhen(interview.scheduledAt)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusTone(interview.status)}`}
        >
          {interview.status.replace("_", " ")}
        </span>
      </div>
    </li>
  );
}

export function JobPostingRow({ job }: { job: JobPosting }) {
  return (
    <li>
      <Link
        href={`/jobs/${job.id}`}
        className="block border border-recall-border/80 bg-white/90 px-3.5 py-3 transition hover:border-recall-violet/40 hover:bg-white"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-recall-navy group-hover:text-recall-blue">
              {job.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-recall-muted">
              {[job.team, job.level, job.location].filter(Boolean).join(" · ") ||
                "No team details"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusTone(job.status)}`}
          >
            {job.status}
          </span>
        </div>
      </Link>
    </li>
  );
}
