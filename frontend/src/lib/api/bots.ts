import { api } from "./client";
import { endpoints } from "./endpoints";
import type { CreateBotBody } from "./types";
import type { Interview, InterviewRecording, InterviewTranscript } from "./hr";

export type CreateBotResponse = {
  ok: true;
  alreadyScheduled?: boolean;
  bot: {
    id: string;
    interviewId: string;
    meetingUrl: string;
    botName: string;
    joinAt: string | null;
    status: string;
  } | null;
  interview: Interview;
  detail?: {
    interview: Interview;
    recording: InterviewRecording | null;
    transcript: InterviewTranscript | null;
  };
  recall?: {
    id: string;
    join_at?: string | null;
    meeting_url?: string;
  };
};

export async function createBot(body: CreateBotBody) {
  const { data } = await api.post<CreateBotResponse>(endpoints.bots.create, body);
  return data;
}

export async function getBot(id: string) {
  const { data } = await api.get(endpoints.bots.byId(id));
  return data;
}
