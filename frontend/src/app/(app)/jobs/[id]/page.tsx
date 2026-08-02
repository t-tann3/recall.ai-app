"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { JobScorecardCriteriaEditor } from "@/components/jobs/JobScorecardCriteriaEditor";
import { getJobPosting, type Candidate, type Interview } from "@/lib/api/hr";

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>
      {children}
    </span>
  );
}

type JobCandidate = {
  candidate: Candidate;
  stage: string;
  interviewCount: number;
  nextInterview: Interview | null;
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Awaited<ReturnType<typeof getJobPosting>> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await getJobPosting(params.id);
        if (!cancelled) setData(detail);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load job posting");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const candidates = useMemo((): JobCandidate[] => {
    if (!data) return [];

    const byId = new Map<
      string,
      {
        candidate: Candidate;
        stage: string;
        interviews: Interview[];
      }
    >();

    for (const { application, candidate } of data.applications) {
      if (!candidate) continue;
      byId.set(candidate.id, {
        candidate,
        stage: application.stage,
        interviews: [],
      });
    }

    for (const { interview, candidate } of data.interviews) {
      if (!candidate) continue;
      const existing = byId.get(candidate.id);
      if (existing) {
        existing.interviews.push(interview);
      } else {
        byId.set(candidate.id, {
          candidate,
          stage: candidate.stage || "interviewing",
          interviews: [interview],
        });
      }
    }

    return [...byId.values()]
      .map(({ candidate, stage, interviews }) => {
        const upcoming = [...interviews]
          .filter((i) => i.scheduledAt)
          .sort((a, b) =>
            String(a.scheduledAt).localeCompare(String(b.scheduledAt)),
          );
        return {
          candidate,
          stage,
          interviewCount: interviews.length,
          nextInterview: upcoming[0] || interviews[0] || null,
        };
      })
      .sort((a, b) => a.candidate.name.localeCompare(b.candidate.name));
  }, [data]);

  if (loading) {
    return (
      <div className="p-8 text-sm text-recall-muted">Loading job posting…</div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">{error || "Job posting not found"}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-recall-blue">
          ← Back to home
        </Link>
      </div>
    );
  }

  const { jobPosting, hiringManager, applications } = data;
  const meta = [jobPosting.team, jobPosting.level, jobPosting.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/"
        className="text-sm font-medium text-recall-blue hover:text-recall-blue-bright"
      >
        ← Back to home
      </Link>

      <div className="mt-6 overflow-hidden border border-recall-border bg-white shadow-[0_1px_0_rgba(0,21,53,0.04)]">
        <div className="bg-gradient-to-r from-recall-navy via-[#0a2a5c] to-recall-navy px-6 py-6 text-white md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-recall-sky">
            Job posting
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {jobPosting.title}
              </h1>
              {meta ? <p className="mt-2 text-sm text-white/65">{meta}</p> : null}
            </div>
            <Badge tone="bg-white/15 text-white">{jobPosting.status}</Badge>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
          <div className="border-b border-recall-border p-6 md:border-b-0 md:border-r md:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
              Description
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-recall-navy">
              {jobPosting.description || "No description provided."}
            </p>
          </div>

          <div className="space-y-5 p-6 md:p-8">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
                Details
              </h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Team</dt>
                  <dd className="font-medium text-recall-navy">{jobPosting.team || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Level</dt>
                  <dd className="font-medium text-recall-navy">{jobPosting.level || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Location</dt>
                  <dd className="font-medium text-recall-navy">
                    {jobPosting.location || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Created</dt>
                  <dd className="font-medium text-recall-navy">
                    {formatWhen(jobPosting.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-recall-border pt-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
                Hiring manager
              </h2>
              {hiringManager ? (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-recall-navy">
                    {hiringManager.name}
                  </p>
                  <p className="mt-0.5 text-xs text-recall-muted">{hiringManager.email}</p>
                  {(hiringManager.title || hiringManager.team) && (
                    <p className="mt-1 text-xs text-recall-muted">
                      {[hiringManager.title, hiringManager.team].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-recall-muted">No hiring manager linked.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="border border-recall-border bg-white p-5 shadow-[0_1px_0_rgba(0,21,53,0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-recall-navy">Applications</h2>
            <span className="text-xs font-medium text-recall-muted">
              {applications.length}
            </span>
          </div>
          {applications.length === 0 ? (
            <p className="mt-6 text-sm text-recall-muted">
              No candidates have applied to this role yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-recall-border">
              {applications.map((item) => {
                const application = item.application;
                const candidate = item.candidate;
                if (!application) return null;

                return (
                  <li
                    key={application.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      {candidate ? (
                        <Link
                          href={`/jobs/${jobPosting.id}/candidates/${candidate.id}`}
                          className="truncate text-sm font-medium text-recall-blue hover:text-recall-blue-bright"
                        >
                          {candidate.name}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-medium text-recall-navy">
                          Candidate
                        </p>
                      )}
                      <p className="truncate text-xs text-recall-muted">
                        {candidate?.email || application.candidateId}
                      </p>
                    </div>
                    <Badge tone="bg-recall-blue/10 text-recall-blue">
                      {application.stage}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border border-recall-border bg-white p-5 shadow-[0_1px_0_rgba(0,21,53,0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-recall-navy">Candidates</h2>
            <span className="text-xs font-medium text-recall-muted">
              {candidates.length}
            </span>
          </div>
          {candidates.length === 0 ? (
            <p className="mt-6 text-sm text-recall-muted">
              Candidates for this role will appear here for evaluation.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-recall-border">
              {candidates.map(({ candidate, stage, interviewCount, nextInterview }) => (
                <li key={candidate.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/jobs/${jobPosting.id}/candidates/${candidate.id}`}
                      className="truncate text-sm font-medium text-recall-blue hover:text-recall-blue-bright"
                    >
                      {candidate.name}
                    </Link>
                    <p className="truncate text-xs text-recall-muted">
                      {interviewCount > 0
                        ? `${interviewCount} interview${interviewCount === 1 ? "" : "s"}${
                            nextInterview?.scheduledAt
                              ? ` · next ${formatWhen(nextInterview.scheduledAt)}`
                              : ""
                          }`
                        : candidate.email}
                    </p>
                  </div>
                  <Badge tone="bg-recall-surface text-recall-navy">{stage}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <JobScorecardCriteriaEditor jobPostingId={jobPosting.id} />
    </div>
  );
}
