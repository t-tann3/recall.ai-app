import { api } from "./client";
import { endpoints } from "./endpoints";
import type {
  ActionItem,
  CreateWorkspaceBody,
  DeveloperEvent,
  Insight,
  MeetingWorkspace,
  Question,
  TranscriptLine,
} from "./types";

export async function listWorkspaces() {
  const { data } = await api.get<{ workspaces: MeetingWorkspace[] }>(
    endpoints.workspaces.list,
  );
  return data;
}

export async function createWorkspace(body: CreateWorkspaceBody) {
  const { data } = await api.post<{ workspace: MeetingWorkspace }>(
    endpoints.workspaces.create,
    body,
  );
  return data;
}

export async function getWorkspace(id: string) {
  const { data } = await api.get<{ workspace: MeetingWorkspace }>(
    endpoints.workspaces.byId(id),
  );
  return data;
}

export async function updateWorkspace(
  id: string,
  body: Partial<Pick<MeetingWorkspace, "title" | "botName">>,
) {
  const { data } = await api.patch<{ workspace: MeetingWorkspace }>(
    endpoints.workspaces.byId(id),
    body,
  );
  return data;
}

export async function deleteWorkspace(id: string) {
  const { data } = await api.delete(endpoints.workspaces.byId(id));
  return data;
}

export async function getWorkspaceSummary(id: string) {
  const { data } = await api.get<{ summary: string | null }>(
    endpoints.workspaces.summary(id),
  );
  return data;
}

export async function getWorkspaceTranscript(id: string) {
  const { data } = await api.get<{ lines: TranscriptLine[] | null }>(
    endpoints.workspaces.transcript(id),
  );
  return data;
}

export async function getWorkspaceInsights(id: string) {
  const { data } = await api.get<{ insights: Insight[] }>(
    endpoints.workspaces.insights(id),
  );
  return data;
}

export async function getWorkspaceActionItems(id: string) {
  const { data } = await api.get<{ actionItems: ActionItem[] }>(
    endpoints.workspaces.actionItems(id),
  );
  return data;
}

export async function getWorkspaceQuestions(id: string) {
  const { data } = await api.get<{ questions: Question[] }>(
    endpoints.workspaces.questions(id),
  );
  return data;
}

export async function getWorkspaceDeveloper(id: string) {
  const { data } = await api.get<{
    botId: string | null;
    recordingId: string | null;
    transcriptId: string | null;
    events: DeveloperEvent[];
  }>(endpoints.workspaces.developer(id));
  return data;
}
