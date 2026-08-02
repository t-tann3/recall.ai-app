import { api } from "./client";
import { endpoints } from "./endpoints";

export type CalendarPlatform = "google_calendar" | "microsoft_outlook";

export type CalendarConnection = {
  id: string;
  hiringManagerId: string;
  platform: CalendarPlatform;
  platformEmail: string | null;
  recallCalendarId: string | null;
  status: "connected" | "error" | "disconnected";
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarStatus = {
  googleConfigured: boolean;
  microsoftConfigured: boolean;
  recallConfigured: boolean;
  oauthRedirectUri: string;
};

export async function getCalendarStatus() {
  const { data } = await api.get<{ ok: true; status: CalendarStatus }>(
    endpoints.calendar.status,
  );
  return data.status;
}

export async function listCalendarConnections() {
  const { data } = await api.get<{ ok: true; connections: CalendarConnection[] }>(
    endpoints.calendar.connections,
  );
  return data.connections;
}

export async function startCalendarOauth(platform: CalendarPlatform) {
  const { data } = await api.get<{ ok: true; url: string; platform: CalendarPlatform }>(
    endpoints.calendar.oauthStart,
    { params: { platform } },
  );
  return data;
}

export async function disconnectCalendar(connectionId: string) {
  const { data } = await api.delete<{
    ok: true;
    disconnected: boolean;
    warning?: string;
  }>(endpoints.calendar.connectionById(connectionId));
  return data;
}
