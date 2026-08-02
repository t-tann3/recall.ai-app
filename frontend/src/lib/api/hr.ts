import { api } from "./client";
import { endpoints } from "./endpoints";

export type JobPosting = {
  id: string;
  title: string;
  team: string | null;
  level: string | null;
  location: string | null;
  description: string;
  status: "draft" | "open" | "paused" | "closed";
  hiringManagerId: string;
  createdAt: string;
  updatedAt: string;
};

export type InterviewStatus =
  | "scheduled"
  | "joining"
  | "in_call"
  | "processing"
  | "ready"
  | "cancelled"
  | "failed";

export type Interview = {
  id: string;
  candidateId: string;
  jobPostingId: string;
  applicationId: string | null;
  type: string;
  status: InterviewStatus;
  scheduledAt: string | null;
  meetingUrl: string | null;
  calendarEventId: string | null;
  botId: string | null;
  recordingId: string | null;
  transcriptId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  stage?: string;
  source?: string | null;
};

export type Application = {
  id: string;
  candidateId: string;
  jobPostingId: string;
  stage: string;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationItem = {
  application: Application;
  candidate: Candidate | null;
};

export type InterviewListItem = {
  interview: Interview;
  candidate: Candidate | null;
  jobPosting: JobPosting | null;
};

function normalizeApplicationRow(row: unknown): JobApplicationItem | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;

  if (r.application && typeof r.application === "object") {
    return {
      application: r.application as Application,
      candidate: (r.candidate as Candidate | null) ?? null,
    };
  }

  if (typeof r.candidateId === "string" && typeof r.id === "string") {
    return {
      application: r as unknown as Application,
      candidate: null,
    };
  }

  return null;
}

function normalizeInterviewRow(
  row: unknown,
  fallbackJob: JobPosting | null = null,
): InterviewListItem | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;

  if (r.interview && typeof r.interview === "object") {
    return {
      interview: r.interview as Interview,
      candidate: (r.candidate as Candidate | null) ?? null,
      jobPosting: (r.jobPosting as JobPosting | null) ?? fallbackJob,
    };
  }

  if (typeof r.status === "string" && typeof r.id === "string") {
    return {
      interview: r as unknown as Interview,
      candidate: null,
      jobPosting: fallbackJob,
    };
  }

  return null;
}

export async function getJobPosting(id: string) {
  const { data } = await api.get<{
    ok: true;
    jobPosting: JobPosting;
    hiringManager: {
      id: string;
      name: string;
      email: string;
      team: string | null;
      title: string | null;
    } | null;
    applications: unknown[];
    interviews: unknown[];
  }>(endpoints.jobPostings.byId(id));

  const applications = (data.applications || [])
    .map(normalizeApplicationRow)
    .filter((item): item is JobApplicationItem => Boolean(item));

  const interviews = (data.interviews || [])
    .map((row) => normalizeInterviewRow(row, data.jobPosting))
    .filter((item): item is InterviewListItem => Boolean(item?.interview?.status));

  const missingCandidate =
    applications.some((a) => !a.candidate) || interviews.some((i) => !i.candidate);

  if (missingCandidate) {
    const { data: candData } = await api.get<{ ok: true; candidates: Candidate[] }>(
      endpoints.candidates.list,
    );
    const byId = new Map(candData.candidates.map((c) => [c.id, c]));

    for (const item of applications) {
      if (!item.candidate) {
        item.candidate = byId.get(item.application.candidateId) || null;
      }
    }
    for (const item of interviews) {
      if (!item.candidate) {
        item.candidate = byId.get(item.interview.candidateId) || null;
      }
    }
  }

  return {
    ...data,
    applications,
    interviews,
  };
}

export async function listJobPostings() {
  const { data } = await api.get<{ ok: true; jobPostings: JobPosting[] }>(
    endpoints.jobPostings.list,
  );
  return data.jobPostings;
}

export async function getCandidate(id: string) {
  const { data } = await api.get<{
    ok: true;
    candidate: Candidate & {
      phone?: string | null;
      linkedInUrl?: string | null;
      source?: string | null;
      stage: string;
      createdAt: string;
      updatedAt: string;
    };
    applications: {
      id: string;
      candidateId: string;
      jobPostingId: string;
      stage: string;
      createdAt: string;
      updatedAt: string;
    }[];
    interviews: Interview[];
  }>(endpoints.candidates.byId(id));

  return data;
}

export async function createJobPosting(body: {
  title: string;
  team?: string;
  level?: string;
  location?: string;
  description?: string;
  status?: JobPosting["status"];
  hiringManagerId?: string;
}) {
  const { data } = await api.post<{ ok: true; jobPosting: JobPosting }>(
    endpoints.jobPostings.create,
    body,
  );
  return data.jobPosting;
}

export type InterviewRecording = {
  id: string;
  interviewId: string;
  botId: string | null;
  mediaUrl: string | null;
  status: "pending" | "processing" | "done" | "failed";
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
};

export type InterviewTranscriptLine = {
  speaker: string;
  text: string;
  startSeconds: number;
  endSeconds: number | null;
};

export type InterviewTranscript = {
  id: string;
  interviewId: string;
  recordingId: string | null;
  status: "pending" | "processing" | "done" | "failed";
  lines: InterviewTranscriptLine[];
  createdAt: string;
  updatedAt: string;
};

export async function getInterview(id: string) {
  const { data } = await api.get<{
    ok: true;
    interview: Interview;
    candidate: Candidate | null;
    jobPosting: JobPosting | null;
    recording: InterviewRecording | null;
    transcript: InterviewTranscript | null;
    scorecard?: {
      id: string;
      interviewId: string;
      hiringManagerId: string;
      recommendation: string;
      score: number | null;
      criteriaScores: {
        criteriaId: string;
        label: string;
        score: number;
        evidence: string;
      }[];
      strengths: string;
      concerns: string;
      notes: string;
      source: "ai" | "manual";
      createdAt: string;
      updatedAt: string;
    } | null;
  }>(endpoints.interviews.byId(id));

  return data;
}

export async function listInterviews() {
  const { data } = await api.get<{ ok: true; interviews: unknown[] }>(
    endpoints.interviews.list,
  );

  // Support enriched items OR flat interview rows (older backend process).
  return (data.interviews || [])
    .map((row): InterviewListItem | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;

      if (r.interview && typeof r.interview === "object") {
        return {
          interview: r.interview as Interview,
          candidate: (r.candidate as Candidate | null) ?? null,
          jobPosting: (r.jobPosting as JobPosting | null) ?? null,
        };
      }

      if (typeof r.status === "string" && typeof r.id === "string") {
        return {
          interview: r as unknown as Interview,
          candidate: null,
          jobPosting: null,
        };
      }

      return null;
    })
    .filter((item): item is InterviewListItem => Boolean(item?.interview?.status));
}
