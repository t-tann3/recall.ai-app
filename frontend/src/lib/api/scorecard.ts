import { api } from "./client";
import { endpoints } from "./endpoints";

export type ScorecardCriterion = {
  id: string;
  label: string;
  description: string;
  weight: number;
};

export type ScorecardCriteria = {
  id: string;
  hiringManagerId: string;
  jobPostingId: string;
  items: ScorecardCriterion[];
  createdAt: string;
  updatedAt: string;
};

export type CriteriaScore = {
  criteriaId: string;
  label: string;
  score: number;
  evidence: string;
};

export type ScorecardResult = {
  id: string;
  interviewId: string;
  hiringManagerId: string;
  recommendation: string;
  score: number | null;
  criteriaScores: CriteriaScore[];
  strengths: string;
  concerns: string;
  notes: string;
  source: "ai" | "manual";
  createdAt: string;
  updatedAt: string;
};

export async function getScorecardCriteria(jobPostingId: string) {
  const { data } = await api.get<{
    ok: true;
    criteria: ScorecardCriteria;
    openaiConfigured: boolean;
  }>(endpoints.scorecardCriteria.me, {
    params: { jobPostingId },
  });
  return data;
}

export async function saveScorecardCriteria(body: {
  jobPostingId: string;
  items: Array<{
    id?: string;
    label: string;
    description?: string;
    weight?: number;
  }>;
}) {
  const { data } = await api.put<{ ok: true; criteria: ScorecardCriteria }>(
    endpoints.scorecardCriteria.me,
    body,
  );
  return data.criteria;
}

export async function generateInterviewScorecard(interviewId: string) {
  const { data } = await api.post<{
    ok: true;
    scorecard: ScorecardResult;
    criteria: ScorecardCriteria;
    usedOpenAI: boolean;
  }>(endpoints.interviews.generateScorecard(interviewId));
  return data;
}

export async function saveInterviewScorecard(
  interviewId: string,
  body: {
    recommendation?: string;
    score?: number | null;
    criteriaScores?: CriteriaScore[];
    strengths?: string;
    concerns?: string;
    notes?: string;
  },
) {
  const { data } = await api.put<{ ok: true; scorecard: ScorecardResult }>(
    endpoints.interviews.scorecard(interviewId),
    body,
  );
  return data.scorecard;
}
