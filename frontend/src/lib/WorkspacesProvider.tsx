"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEMO_WORKSPACE,
  detectPlatform,
  type MeetingWorkspace,
  type WorkspaceStatus,
} from "@/lib/workspaces";

const STORAGE_KEY = "recall-meeting-workspaces";

type WorkspacesContextValue = {
  workspaces: MeetingWorkspace[];
  ready: boolean;
  createWorkspace: (meetingUrl: string) => MeetingWorkspace;
  getWorkspace: (id: string) => MeetingWorkspace | null;
  updateStatus: (id: string, status: WorkspaceStatus) => void;
};

const WorkspacesContext = createContext<WorkspacesContextValue | null>(null);

function loadWorkspaces(): MeetingWorkspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([DEMO_WORKSPACE]));
      return [DEMO_WORKSPACE];
    }
    return JSON.parse(raw) as MeetingWorkspace[];
  } catch {
    return [DEMO_WORKSPACE];
  }
}

export function WorkspacesProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<MeetingWorkspace[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWorkspaces(loadWorkspaces());
    setReady(true);
  }, []);

  const createWorkspace = useCallback(
    (meetingUrl: string) => {
      const id = `ws_${Date.now().toString(36)}`;
      const workspace: MeetingWorkspace = {
        id,
        title: "New Meeting",
        meetingUrl: meetingUrl.trim(),
        botName: "Workspace Bot",
        status: "joining",
        platform: detectPlatform(meetingUrl),
        createdAt: new Date().toISOString(),
        summary: null,
        transcript: null,
        insights: [],
        actionItems: [],
        questions: [],
        developer: {
          botId: null,
          recordingId: null,
          transcriptId: null,
          events: [
            {
              type: "client.create_requested",
              at: new Date().toISOString(),
              note: "UI requested bot join — wire to POST /api/bots",
            },
          ],
        },
      };
      setWorkspaces((prev) => {
        const next = [workspace, ...prev];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return workspace;
    },
    [],
  );

  const getWorkspace = useCallback(
    (id: string) => workspaces.find((w) => w.id === id) ?? null,
    [workspaces],
  );

  const updateStatus = useCallback((id: string, status: WorkspaceStatus) => {
    setWorkspaces((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, status } : w));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      workspaces,
      ready,
      createWorkspace,
      getWorkspace,
      updateStatus,
    }),
    [workspaces, ready, createWorkspace, getWorkspace, updateStatus],
  );

  return (
    <WorkspacesContext.Provider value={value}>{children}</WorkspacesContext.Provider>
  );
}

export function useWorkspaces() {
  const ctx = useContext(WorkspacesContext);
  if (!ctx) {
    throw new Error("useWorkspaces must be used within WorkspacesProvider");
  }
  return ctx;
}
