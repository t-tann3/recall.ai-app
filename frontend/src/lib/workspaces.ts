export type WorkspaceStatus =
  | "joining"
  | "in_call"
  | "processing"
  | "ready"
  | "failed";

export type MeetingWorkspace = {
  id: string;
  title: string;
  meetingUrl: string;
  botName: string;
  status: WorkspaceStatus;
  platform: "Google Meet" | "Zoom" | "Microsoft Teams" | "Unknown";
  createdAt: string;
  summary: string | null;
  transcript: { speaker: string; text: string; start: string }[] | null;
  insights: string[];
  actionItems: { text: string; owner: string | null; done: boolean }[];
  questions: string[];
  developer: {
    botId: string | null;
    recordingId: string | null;
    transcriptId: string | null;
    events: { type: string; at: string; note: string }[];
  };
};

export const DEMO_WORKSPACE: MeetingWorkspace = {
  id: "demo-kickoff",
  title: "Product Kickoff",
  meetingUrl: "https://meet.google.com/abc-defg-hij",
  botName: "Workspace Bot",
  status: "ready",
  platform: "Google Meet",
  createdAt: new Date().toISOString(),
  summary:
    "The team aligned on shipping Shop Talk — a product for meeting conversations. Scope covers capturing the call, then a tabbed workspace with summary, transcript, insights, actions, and questions.",
  transcript: [
    {
      speaker: "Alex",
      text: "Let's use Recall as the recording and transcript layer, then build the workspace UI on top.",
      start: "00:01:12",
    },
    {
      speaker: "Jordan",
      text: "We should expose raw webhook events in a Developer View so the demo proves API literacy.",
      start: "00:02:40",
    },
    {
      speaker: "Sam",
      text: "Action items: wire Create Bot, verify webhooks, and generate summary plus action items after transcript.done.",
      start: "00:04:05",
    },
  ],
  insights: [
    "Decision: ship Shop Talk as a conversations product, not a generic summarizer.",
    "Risk: ad-hoc bot joins may hit 507 — schedule with join_at in production.",
    "Opportunity: Developer View differentiates this from Notion/Gong clones.",
  ],
  actionItems: [
    { text: "Create bot from pasted meeting URL", owner: "Alex", done: false },
    { text: "Verify Recall webhooks and process async", owner: "Jordan", done: false },
    { text: "Populate workspace tabs after transcript.done", owner: "Sam", done: false },
  ],
  questions: [
    "Which Recall region will we use for the demo?",
    "Do we start with async transcription only, or add real-time later?",
    "Should Developer View show signed raw payloads or redacted samples?",
  ],
  developer: {
    botId: "bot_demo_01",
    recordingId: "rec_demo_01",
    transcriptId: "tr_demo_01",
    events: [
      { type: "bot.joining_call", at: "T+0s", note: "Bot created via POST /api/v1/bot/" },
      { type: "bot.in_call_recording", at: "T+12s", note: "Bot admitted; recording started" },
      { type: "bot.done", at: "T+32m", note: "Meeting ended; bot left" },
      { type: "recording.done", at: "T+32m10s", note: "Media ready — create async transcript" },
      { type: "transcript.done", at: "T+32m25s", note: "Transcript downloaded; workspace marked ready" },
    ],
  },
};

export function detectPlatform(
  url: string,
): MeetingWorkspace["platform"] {
  if (url.includes("meet.google")) return "Google Meet";
  if (url.includes("zoom.us")) return "Zoom";
  if (url.includes("teams.microsoft") || url.includes("teams.live"))
    return "Microsoft Teams";
  return "Unknown";
}

export function statusLabel(status: WorkspaceStatus): string {
  switch (status) {
    case "joining":
      return "Joining";
    case "in_call":
      return "In call";
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
  }
}
