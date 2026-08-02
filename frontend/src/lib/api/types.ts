export type WorkspaceStatus =
  | "joining"
  | "in_call"
  | "processing"
  | "ready"
  | "failed";

export type MeetingPlatform =
  | "Google Meet"
  | "Zoom"
  | "Microsoft Teams"
  | "Unknown";

export type MeetingWorkspace = {
  id: string;
  title: string;
  meetingUrl: string;
  platform: MeetingPlatform;
  botName: string;
  status: WorkspaceStatus;
  botId: string | null;
  recordingId: string | null;
  transcriptId: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TranscriptLine = {
  speaker: string;
  text: string;
  start: string;
};

export type ActionItem = {
  id: string;
  workspaceId: string;
  text: string;
  owner: string | null;
  done: boolean;
  createdAt: string;
};

export type Insight = {
  id: string;
  workspaceId: string;
  text: string;
  createdAt: string;
};

export type Question = {
  id: string;
  workspaceId: string;
  text: string;
  createdAt: string;
};

export type DeveloperEvent = {
  id: string;
  workspaceId: string;
  type: string;
  at: string;
  note: string;
  payload: unknown | null;
};

export type CreateWorkspaceBody = {
  meetingUrl: string;
  title?: string;
  botName?: string;
};

export type CreateBotBody = {
  interviewId: string;
  meetingUrl?: string;
  botName?: string;
  joinAt?: string;
};

export type HealthResponse = {
  ok: true;
  service: string;
  baseUrl: string;
  endpoints?: Record<string, string>;
};
