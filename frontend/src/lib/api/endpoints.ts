/**
 * Path templates relative to API_BASE_URL.
 * Prefer these over hardcoding strings in components.
 */
export const endpoints = {
  health: "/health",
  auth: {
    signup: "/api/auth/signup",
    login: "/api/auth/login",
    me: "/api/auth/me",
  },
  bots: {
    create: "/api/bots",
    byId: (id: string) => `/api/bots/${id}`,
  },
  jobPostings: {
    list: "/api/job-postings",
    create: "/api/job-postings",
    byId: (id: string) => `/api/job-postings/${id}`,
  },
  candidates: {
    list: "/api/candidates",
    byId: (id: string) => `/api/candidates/${id}`,
  },
  interviews: {
    list: "/api/interviews",
    byId: (id: string) => `/api/interviews/${id}`,
  },
  workspaces: {
    list: "/api/workspaces",
    create: "/api/workspaces",
    byId: (id: string) => `/api/workspaces/${id}`,
    summary: (id: string) => `/api/workspaces/${id}/summary`,
    transcript: (id: string) => `/api/workspaces/${id}/transcript`,
    insights: (id: string) => `/api/workspaces/${id}/insights`,
    actionItems: (id: string) => `/api/workspaces/${id}/action-items`,
    questions: (id: string) => `/api/workspaces/${id}/questions`,
    developer: (id: string) => `/api/workspaces/${id}/developer`,
  },
} as const;
