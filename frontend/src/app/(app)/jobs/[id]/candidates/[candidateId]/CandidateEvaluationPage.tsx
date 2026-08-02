"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getCandidate,
  getInterview,
  getJobPosting,
  type Interview,
  type InterviewRecording,
  type InterviewTranscript,
} from "@/lib/api/hr";
import { createBot } from "@/lib/api/bots";
import {
  generateInterviewScorecard,
  saveInterviewScorecard,
  type CriteriaScore,
} from "@/lib/api/scorecard";

type PanelTab = "scorecard" | "recording" | "transcript";

type Recommendation =
  | "strong_hire"
  | "hire"
  | "lean_hire"
  | "lean_no"
  | "no_hire"
  | "";

type EvaluationDraft = {
  recommendation: Recommendation;
  score: string;
  strengths: string;
  concerns: string;
  notes: string;
  criteriaScores: CriteriaScore[];
  updatedAt: string | null;
};

const EMPTY_DRAFT: EvaluationDraft = {
  recommendation: "",
  score: "",
  strengths: "",
  concerns: "",
  notes: "",
  criteriaScores: [],
  updatedAt: null,
};

const RECOMMENDATIONS: { value: Recommendation; label: string }[] = [
  { value: "strong_hire", label: "Strong hire" },
  { value: "hire", label: "Hire" },
  { value: "lean_hire", label: "Lean hire" },
  { value: "lean_no", label: "Lean no" },
  { value: "no_hire", label: "No hire" },
];

function storageKey(jobId: string, candidateId: string, interviewId: string) {
  return `shoptalk:eval:${jobId}:${candidateId}:${interviewId}`;
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "Unscheduled";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function interviewLabel(interview: Interview) {
  return interview.type.replaceAll("_", " ");
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>
      {children}
    </span>
  );
}

function loadDraft(jobId: string, candidateId: string, interviewId: string): EvaluationDraft {
  try {
    const raw = localStorage.getItem(storageKey(jobId, candidateId, interviewId));
    if (!raw) return EMPTY_DRAFT;
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as EvaluationDraft) };
  } catch {
    return EMPTY_DRAFT;
  }
}

export default function CandidateEvaluationPage() {
  const params = useParams<{ id: string; candidateId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewFromUrl = searchParams.get("interview");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [candidate, setCandidate] = useState<Awaited<
    ReturnType<typeof getCandidate>
  > | null>(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EvaluationDraft>(EMPTY_DRAFT);
  const [savedFlash, setSavedFlash] = useState(false);
  const [savedByInterview, setSavedByInterview] = useState<Record<string, boolean>>({});
  const [panelTab, setPanelTab] = useState<PanelTab>("scorecard");
  const [recording, setRecording] = useState<InterviewRecording | null>(null);
  const [transcript, setTranscript] = useState<InterviewTranscript | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [botBusy, setBotBusy] = useState(false);
  const [botMessage, setBotMessage] = useState<string | null>(null);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [jobDetail, candidateDetail] = await Promise.all([
          getJobPosting(params.id),
          getCandidate(params.candidateId),
        ]);

        if (cancelled) return;

        const linked =
          candidateDetail.applications.some((a) => a.jobPostingId === params.id) ||
          candidateDetail.interviews.some((i) => i.jobPostingId === params.id);

        if (!linked) {
          setError("This candidate is not linked to this job posting.");
          setCandidate(null);
          return;
        }

        setJobTitle(jobDetail.jobPosting.title);
        setCandidate(candidateDetail);

        const roleInterviews = candidateDetail.interviews.filter(
          (i) => i.jobPostingId === params.id,
        );
        const flags: Record<string, boolean> = {};
        for (const interview of roleInterviews) {
          flags[interview.id] = Boolean(
            loadDraft(params.id, params.candidateId, interview.id).updatedAt,
          );
        }
        setSavedByInterview(flags);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load evaluation");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, params.candidateId]);

  const application = useMemo(
    () => candidate?.applications.find((a) => a.jobPostingId === params.id) || null,
    [candidate, params.id],
  );

  const interviews = useMemo(
    () =>
      (candidate?.interviews || [])
        .filter((i) => i.jobPostingId === params.id)
        .sort((a, b) =>
          String(a.scheduledAt || a.createdAt).localeCompare(
            String(b.scheduledAt || b.createdAt),
          ),
        ),
    [candidate, params.id],
  );

  useEffect(() => {
    if (!candidate || interviews.length === 0) {
      setSelectedInterviewId(null);
      return;
    }

    const validIds = new Set(interviews.map((i) => i.id));
    const nextId =
      (interviewFromUrl && validIds.has(interviewFromUrl) && interviewFromUrl) ||
      interviews[0].id;

    setSelectedInterviewId(nextId);

    if (interviewFromUrl !== nextId) {
      router.replace(
        `/jobs/${params.id}/candidates/${params.candidateId}?interview=${nextId}`,
        { scroll: false },
      );
    }
  }, [candidate, interviews, interviewFromUrl, params.id, params.candidateId, router]);

  useEffect(() => {
    if (!selectedInterviewId) {
      setDraft(EMPTY_DRAFT);
      setRecording(null);
      setTranscript(null);
      return;
    }
    setDraft(loadDraft(params.id, params.candidateId, selectedInterviewId));
    setSavedFlash(false);
    setPanelTab("scorecard");
    setGenerateMessage(null);

    let cancelled = false;
    async function loadMedia() {
      setMediaLoading(true);
      try {
        const detail = await getInterview(selectedInterviewId!);
        if (cancelled) return;
        setRecording(detail.recording);
        setTranscript(detail.transcript);
        if (detail.scorecard) {
          setDraft({
            recommendation: (detail.scorecard.recommendation || "") as Recommendation,
            score:
              detail.scorecard.score != null ? String(detail.scorecard.score) : "",
            strengths: detail.scorecard.strengths || "",
            concerns: detail.scorecard.concerns || "",
            notes: detail.scorecard.notes || "",
            criteriaScores: detail.scorecard.criteriaScores || [],
            updatedAt: detail.scorecard.updatedAt,
          });
        }
        if (detail.interview) {
          setCandidate((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              interviews: prev.interviews.map((row) =>
                row.id === detail.interview.id ? detail.interview : row,
              ),
            };
          });
        }
      } catch {
        if (!cancelled) {
          setRecording(null);
          setTranscript(null);
        }
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    }
    loadMedia();
    return () => {
      cancelled = true;
    };
  }, [params.id, params.candidateId, selectedInterviewId]);

  const selectedInterview =
    interviews.find((i) => i.id === selectedInterviewId) || null;

  function selectInterview(interviewId: string) {
    setSelectedInterviewId(interviewId);
    setBotMessage(null);
    router.replace(
      `/jobs/${params.id}/candidates/${params.candidateId}?interview=${interviewId}`,
      { scroll: false },
    );
  }

  async function sendBot() {
    if (!selectedInterview) return;
    setBotBusy(true);
    setBotMessage(null);
    try {
      const result = await createBot({
        interviewId: selectedInterview.id,
        meetingUrl: selectedInterview.meetingUrl || undefined,
        joinAt: selectedInterview.scheduledAt || undefined,
        botName: "Shop Talk",
      });

      setCandidate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          interviews: prev.interviews.map((row) =>
            row.id === result.interview.id ? result.interview : row,
          ),
        };
      });

      if (result.detail?.recording) setRecording(result.detail.recording);
      if (result.detail?.transcript) setTranscript(result.detail.transcript);

      setBotMessage(
        result.alreadyScheduled
          ? `Bot already scheduled (${result.bot?.id || result.interview.botId}).`
          : `Bot scheduled with Recall (${result.bot?.id || result.recall?.id}).`,
      );
    } catch (err) {
      setBotMessage(err instanceof Error ? err.message : "Failed to create bot");
    } finally {
      setBotBusy(false);
    }
  }

  function updateField<K extends keyof EvaluationDraft>(key: K, value: EvaluationDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSavedFlash(false);
  }

  async function generateScorecard() {
    if (!selectedInterviewId) return;
    setGenerateBusy(true);
    setGenerateMessage(null);
    try {
      const result = await generateInterviewScorecard(selectedInterviewId);
      setDraft({
        recommendation: (result.scorecard.recommendation || "") as Recommendation,
        score:
          result.scorecard.score != null ? String(result.scorecard.score) : "",
        strengths: result.scorecard.strengths || "",
        concerns: result.scorecard.concerns || "",
        notes: result.scorecard.notes || "",
        criteriaScores: result.scorecard.criteriaScores || [],
        updatedAt: result.scorecard.updatedAt,
      });
      setGenerateMessage(
        result.usedOpenAI
          ? "Scorecard drafted from transcript with OpenAI using your criteria."
          : "Scorecard drafted from transcript (heuristic — add OPENAI_API_KEY for LLM scoring).",
      );
      setPanelTab("scorecard");
    } catch (err) {
      setGenerateMessage(
        err instanceof Error ? err.message : "Failed to generate scorecard",
      );
    } finally {
      setGenerateBusy(false);
    }
  }

  async function saveEvaluation() {
    if (!selectedInterviewId) return;
    const next = { ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(
      storageKey(params.id, params.candidateId, selectedInterviewId),
      JSON.stringify(next),
    );

    try {
      const saved = await saveInterviewScorecard(selectedInterviewId, {
        recommendation: draft.recommendation,
        score: draft.score ? Number(draft.score) : null,
        criteriaScores: draft.criteriaScores,
        strengths: draft.strengths,
        concerns: draft.concerns,
        notes: draft.notes,
      });
      setDraft({
        ...next,
        updatedAt: saved.updatedAt,
        criteriaScores: saved.criteriaScores || draft.criteriaScores,
      });
    } catch {
      setDraft(next);
    }

    setSavedFlash(true);
    setSavedByInterview((prev) => ({ ...prev, [selectedInterviewId]: true }));
  }

  if (loading) {
    return (
      <div className="p-8 text-sm text-recall-muted">Loading evaluation…</div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">{error || "Candidate not found"}</p>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link href="/" className="text-recall-blue hover:text-recall-blue-bright">
            ← Back to home
          </Link>
          <Link
            href={`/jobs/${params.id}`}
            className="text-recall-blue hover:text-recall-blue-bright"
          >
            View job posting
          </Link>
        </div>
      </div>
    );
  }

  const { candidate: person } = candidate;

  return (
    <div className="p-6 md:p-8">
      <Link
        href={`/jobs/${params.id}`}
        className="text-sm font-medium text-recall-blue hover:text-recall-blue-bright"
      >
        ← Back to {jobTitle || "job posting"}
      </Link>

      <div className="mt-6 overflow-hidden border border-recall-border bg-white shadow-[0_1px_0_rgba(0,21,53,0.04)]">
        <div className="bg-gradient-to-r from-recall-navy via-[#0a2a5c] to-recall-navy px-6 py-6 text-white md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-recall-sky">
            Interview evaluation
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {person.name}
              </h1>
              <p className="mt-2 text-sm text-white/65">
                {jobTitle}
                {selectedInterview
                  ? ` · ${interviewLabel(selectedInterview)}`
                  : application
                    ? ` · ${application.stage.replaceAll("_", " ")}`
                    : ""}
              </p>
              {selectedInterview ? (
                <p className="mt-1 text-xs text-white/50">
                  Evaluating interview on {formatWhen(selectedInterview.scheduledAt)}
                </p>
              ) : null}
            </div>
            {selectedInterview ? (
              <Badge tone="bg-white/15 text-white">
                {selectedInterview.status.replaceAll("_", " ")}
              </Badge>
            ) : (
              <Badge tone="bg-white/15 text-white">
                {(application?.stage || person.stage || "applied").replaceAll("_", " ")}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6 border-b border-recall-border p-6 lg:border-b-0 lg:border-r md:p-8">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
                Candidate
              </h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Email</dt>
                  <dd className="font-medium text-recall-navy">{person.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Source</dt>
                  <dd className="font-medium capitalize text-recall-navy">
                    {person.source || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Pipeline stage</dt>
                  <dd className="font-medium capitalize text-recall-navy">
                    {(application?.stage || person.stage || "—").replaceAll("_", " ")}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-recall-border pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
                  Select interview
                </h2>
                <span className="text-xs text-recall-muted">{interviews.length}</span>
              </div>
              <p className="mt-2 text-xs text-recall-muted">
                Each interview has its own scorecard. Choose which one you’re evaluating.
              </p>
              {interviews.length === 0 ? (
                <p className="mt-4 text-sm text-recall-muted">
                  No interviews scheduled yet for this role.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {interviews.map((interview) => {
                    const active = interview.id === selectedInterviewId;
                    return (
                      <li key={interview.id}>
                        <button
                          type="button"
                          onClick={() => selectInterview(interview.id)}
                          className={`w-full border px-3.5 py-3 text-left transition ${
                            active
                              ? "border-recall-blue bg-recall-blue/5 ring-1 ring-recall-blue/30"
                              : "border-recall-border bg-white hover:border-recall-blue/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold capitalize text-recall-navy">
                                {interviewLabel(interview)}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-recall-muted">
                                {formatWhen(interview.scheduledAt)}
                              </p>
                              {savedByInterview[interview.id] ? (
                                <p className="mt-1 text-[11px] text-emerald-700">
                                  Scorecard saved
                                </p>
                              ) : interview.status === "ready" ||
                                interview.recordingId ||
                                interview.transcriptId ? (
                                <p className="mt-1 text-[11px] text-recall-blue">
                                  Recording available
                                </p>
                              ) : (
                                <p className="mt-1 text-[11px] text-recall-muted">
                                  No scorecard yet
                                </p>
                              )}
                            </div>
                            <Badge
                              tone={
                                active
                                  ? "bg-recall-blue/10 text-recall-blue"
                                  : "bg-recall-surface text-recall-navy"
                              }
                            >
                              {interview.status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8">
            {!selectedInterview ? (
              <div className="flex h-full min-h-[240px] items-center justify-center">
                <p className="max-w-sm text-center text-sm text-recall-muted">
                  Select an interview on the left to open its scorecard, recording, and
                  transcript.
                </p>
              </div>
            ) : (
              <>
                <div className="border border-recall-border bg-recall-surface/60 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-recall-muted">
                        Interview
                      </p>
                      <p className="mt-1 text-sm font-semibold capitalize text-recall-navy">
                        {interviewLabel(selectedInterview)} · {person.name}
                      </p>
                      <p className="mt-0.5 text-xs text-recall-muted">
                        {jobTitle} · {formatWhen(selectedInterview.scheduledAt)} ·{" "}
                        {selectedInterview.status.replaceAll("_", " ")}
                      </p>
                      {selectedInterview.meetingUrl ? (
                        <p className="mt-1 truncate text-xs text-recall-muted">
                          {selectedInterview.meetingUrl}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-amber-700">
                          No meeting URL on this interview — add one before sending a bot.
                        </p>
                      )}
                      {selectedInterview.botId ? (
                        <p className="mt-1 font-mono text-[11px] text-recall-muted">
                          Bot: {selectedInterview.botId}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={sendBot}
                      disabled={
                        botBusy ||
                        !selectedInterview.meetingUrl ||
                        Boolean(selectedInterview.botId)
                      }
                      className="shrink-0 bg-recall-blue px-3 py-2 text-xs font-semibold text-white transition hover:bg-recall-blue-bright disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {botBusy
                        ? "Scheduling…"
                        : selectedInterview.botId
                          ? "Bot scheduled"
                          : "Send recording bot"}
                    </button>
                  </div>
                  {botMessage ? (
                    <p className="mt-3 text-xs text-recall-navy">{botMessage}</p>
                  ) : null}
                </div>

                <div className="mt-4 flex gap-1 border-b border-recall-border">
                  {(
                    [
                      ["scorecard", "Scorecard"],
                      ["recording", "Recording"],
                      ["transcript", "Transcript"],
                    ] as const
                  ).map(([id, label]) => {
                    const active = panelTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPanelTab(id)}
                        className={`px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "border-b-2 border-recall-blue text-recall-navy"
                            : "text-recall-muted hover:text-recall-navy"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {panelTab === "scorecard" ? (
                  <>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
                          Interview scorecard
                        </h2>
                        <p className="mt-1 text-sm text-recall-muted">
                          Generate from the transcript using your Settings criteria, then edit
                          and save.
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                        <button
                          type="button"
                          onClick={generateScorecard}
                          disabled={
                            generateBusy ||
                            !transcript ||
                            transcript.status !== "done" ||
                            !transcript.lines?.length
                          }
                          className="bg-recall-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-recall-blue disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {generateBusy ? "Generating…" : "Generate from transcript"}
                        </button>
                        {draft.updatedAt ? (
                          <p className="text-[11px] text-recall-muted">
                            Saved {formatWhen(draft.updatedAt)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {generateMessage ? (
                      <p className="mt-3 text-xs text-recall-navy">{generateMessage}</p>
                    ) : null}
                    {!transcript ||
                    transcript.status !== "done" ||
                    !transcript.lines?.length ? (
                      <p className="mt-3 text-xs text-amber-700">
                        Transcript must be ready before you can generate a scorecard.
                      </p>
                    ) : null}

                    <div className="mt-5 space-y-5">
                      {draft.criteriaScores.length > 0 ? (
                        <div>
                          <h3 className="text-sm font-medium text-recall-navy">
                            Criteria scores
                          </h3>
                          <ul className="mt-2 space-y-2">
                            {draft.criteriaScores.map((row) => (
                              <li
                                key={`${row.criteriaId}-${row.label}`}
                                className="border border-recall-border px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-recall-navy">
                                    {row.label}
                                  </p>
                                  <span className="text-sm font-medium text-recall-blue">
                                    {row.score}/5
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-recall-muted">{row.evidence}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <fieldset>
                        <legend className="text-sm font-medium text-recall-navy">
                          Recommendation
                        </legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {RECOMMENDATIONS.map((option) => {
                            const selected = draft.recommendation === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateField("recommendation", option.value)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                  selected
                                    ? "bg-recall-navy text-white"
                                    : "bg-recall-surface text-recall-navy hover:bg-recall-blue/10"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>

                      <label className="block">
                        <span className="text-sm font-medium text-recall-navy">
                          Overall score (1–5)
                        </span>
                        <select
                          value={draft.score}
                          onChange={(e) => updateField("score", e.target.value)}
                          className="mt-2 w-full border border-recall-border bg-white px-3 py-2 text-sm text-recall-navy outline-none focus:border-recall-blue"
                        >
                          <option value="">Select a score</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={String(n)}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-recall-navy">Strengths</span>
                        <textarea
                          value={draft.strengths}
                          onChange={(e) => updateField("strengths", e.target.value)}
                          rows={3}
                          placeholder={`What stood out in the ${interviewLabel(selectedInterview)}?`}
                          className="mt-2 w-full resize-y border border-recall-border bg-white px-3 py-2 text-sm text-recall-navy outline-none focus:border-recall-blue"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-recall-navy">Concerns</span>
                        <textarea
                          value={draft.concerns}
                          onChange={(e) => updateField("concerns", e.target.value)}
                          rows={3}
                          placeholder="Risks or gaps from this interview"
                          className="mt-2 w-full resize-y border border-recall-border bg-white px-3 py-2 text-sm text-recall-navy outline-none focus:border-recall-blue"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-recall-navy">Notes</span>
                        <textarea
                          value={draft.notes}
                          onChange={(e) => updateField("notes", e.target.value)}
                          rows={4}
                          placeholder="Notes specific to this interview"
                          className="mt-2 w-full resize-y border border-recall-border bg-white px-3 py-2 text-sm text-recall-navy outline-none focus:border-recall-blue"
                        />
                      </label>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={saveEvaluation}
                          className="bg-recall-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-recall-blue-bright"
                        >
                          Save interview evaluation
                        </button>
                        {savedFlash ? (
                          <span className="text-sm text-emerald-700">Saved</span>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}

                {panelTab === "recording" ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
                        Raw recording
                      </h2>
                      <p className="mt-1 text-sm text-recall-muted">
                        Playback for this interview after the bot finishes processing.
                      </p>
                    </div>
                    {mediaLoading ? (
                      <p className="text-sm text-recall-muted">Loading recording…</p>
                    ) : recording?.mediaUrl && recording.status === "done" ? (
                      <div className="space-y-3">
                        <video
                          key={recording.id}
                          controls
                          className="w-full max-h-[420px] bg-recall-navy"
                          src={recording.mediaUrl}
                        >
                          Your browser does not support video playback.
                        </video>
                        <dl className="grid gap-2 text-xs text-recall-muted sm:grid-cols-3">
                          <div>
                            <dt className="uppercase tracking-[0.12em]">Status</dt>
                            <dd className="mt-0.5 font-medium capitalize text-recall-navy">
                              {recording.status}
                            </dd>
                          </div>
                          <div>
                            <dt className="uppercase tracking-[0.12em]">Duration</dt>
                            <dd className="mt-0.5 font-medium text-recall-navy">
                              {recording.durationSeconds != null
                                ? formatClock(recording.durationSeconds)
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="uppercase tracking-[0.12em]">Recording ID</dt>
                            <dd className="mt-0.5 font-mono text-recall-navy">
                              {recording.id}
                            </dd>
                          </div>
                        </dl>
                        <a
                          href={recording.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-sm font-medium text-recall-blue hover:text-recall-blue-bright"
                        >
                          Open raw media URL
                        </a>
                      </div>
                    ) : (
                      <div className="border border-dashed border-recall-border px-4 py-10 text-center">
                        <p className="text-sm text-recall-muted">
                          {recording
                            ? `Recording is ${recording.status.replaceAll("_", " ")}. It will appear here when ready.`
                            : "No recording for this interview yet. It will show up after the call is captured."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                {panelTab === "transcript" ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
                        Raw transcript
                      </h2>
                      <p className="mt-1 text-sm text-recall-muted">
                        Speaker-attributed transcript for this interview.
                      </p>
                    </div>
                    {mediaLoading ? (
                      <p className="text-sm text-recall-muted">Loading transcript…</p>
                    ) : transcript &&
                      transcript.status === "done" &&
                      transcript.lines.length > 0 ? (
                      <div className="max-h-[480px] space-y-3 overflow-y-auto border border-recall-border bg-recall-surface/40 p-4">
                        {transcript.lines.map((line, index) => (
                          <div key={`${line.startSeconds}-${index}`} className="text-sm">
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-recall-navy">
                                {line.speaker}
                              </span>
                              <span className="font-mono text-[11px] text-recall-muted">
                                {formatClock(line.startSeconds)}
                              </span>
                            </div>
                            <p className="mt-1 leading-relaxed text-recall-navy/90">
                              {line.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-recall-border px-4 py-10 text-center">
                        <p className="text-sm text-recall-muted">
                          {transcript
                            ? `Transcript is ${transcript.status.replaceAll("_", " ")}. It will appear here when ready.`
                            : "No transcript for this interview yet. It will show up after processing completes."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
