"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import {
  disconnectCalendar,
  getCalendarStatus,
  listCalendarConnections,
  startCalendarOauth,
  type CalendarConnection,
  type CalendarPlatform,
  type CalendarStatus,
} from "@/lib/api/calendar";

export default function SettingsPageContent() {
  const { hiringManager } = useAuth();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [busyPlatform, setBusyPlatform] = useState<CalendarPlatform | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const fields = [
    {
      label: "RECALL_REGION",
      hint: "us-west-2 · us-east-1 · eu-central-1 · ap-northeast-1",
    },
    {
      label: "RECALL_API_KEY",
      hint: "Region-scoped key from the developers dashboard",
    },
    {
      label: "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET",
      hint: "Google Cloud OAuth client for Calendar connect",
    },
    {
      label: "OPENAI_API_KEY",
      hint: "Optional — LLM scorecards from transcripts (else heuristic draft)",
    },
    {
      label: "PUBLIC_API_BASE_URL",
      hint: "Must match OAuth redirect: …/api/calendar/oauth/callback",
    },
  ] as const;

  const initial = hiringManager?.name.trim().charAt(0).toUpperCase() || "U";

  const loadCalendar = useCallback(async () => {
    setLoadingCalendar(true);
    setCalendarError(null);
    try {
      const [nextStatus, nextConnections] = await Promise.all([
        getCalendarStatus(),
        listCalendarConnections(),
      ]);
      setStatus(nextStatus);
      setConnections(nextConnections);
    } catch (err) {
      setCalendarError(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setLoadingCalendar(false);
    }
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    const result = searchParams.get("calendar");
    const message = searchParams.get("message");
    if (!result) return;

    if (result === "connected") {
      setBanner("Calendar connected. Events will sync through Recall once webhooks are live.");
    } else if (result === "partial") {
      setBanner(
        message
          ? `OAuth succeeded, but Recall calendar setup needs attention: ${message}`
          : "OAuth succeeded, but Recall calendar setup needs attention.",
      );
    } else if (result === "error") {
      setBanner(message || "Calendar connect failed.");
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("calendar");
    url.searchParams.delete("message");
    url.searchParams.delete("platform");
    window.history.replaceState({}, "", url.pathname);
    loadCalendar();
  }, [searchParams, loadCalendar]);

  async function connect(platform: CalendarPlatform) {
    setBusyPlatform(platform);
    setBanner(null);
    try {
      const { url } = await startCalendarOauth(platform);
      window.location.href = url;
    } catch (err) {
      setBusyPlatform(null);
      setBanner(err instanceof Error ? err.message : "Could not start OAuth");
    }
  }

  async function onDisconnect(connectionId: string) {
    setDisconnectingId(connectionId);
    setBanner(null);
    try {
      const result = await disconnectCalendar(connectionId);
      if (result.warning) setBanner(result.warning);
      await loadCalendar();
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setDisconnectingId(null);
    }
  }

  const googleConnection = connections.find((c) => c.platform === "google_calendar");

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-recall-navy">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-sm text-recall-muted">
          Account, calendar sync, and environment checklist for Shop Talk.
        </p>
      </div>

      {banner ? (
        <div className="mb-5 max-w-3xl border border-recall-border bg-white px-4 py-3 text-sm text-recall-navy">
          {banner}
        </div>
      ) : null}

      <div className="grid max-w-3xl gap-5">
        <section className="border border-recall-border bg-white shadow-[0_1px_0_rgba(0,21,53,0.04)]">
          <div className="border-b border-recall-border bg-recall-navy px-5 py-4 text-white">
            <p className="text-sm font-semibold">Account</p>
            <p className="mt-1 text-xs text-white/55">Logged-in hiring manager</p>
          </div>
          {hiringManager ? (
            <div className="flex items-start gap-4 px-5 py-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-recall-blue text-lg font-semibold text-white">
                {initial}
              </span>
              <dl className="min-w-0 flex-1 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Name</dt>
                  <dd className="font-medium text-recall-navy">{hiringManager.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Email</dt>
                  <dd className="font-medium text-recall-navy">{hiringManager.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Title</dt>
                  <dd className="font-medium text-recall-navy">
                    {hiringManager.title || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-recall-muted">Team</dt>
                  <dd className="font-medium text-recall-navy">
                    {hiringManager.team || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="px-5 py-5 text-sm text-recall-muted">Not signed in.</p>
          )}
        </section>

        <section className="border border-recall-border bg-white shadow-[0_1px_0_rgba(0,21,53,0.04)]">
          <div className="border-b border-recall-border bg-recall-navy px-5 py-4 text-white">
            <p className="text-sm font-semibold">Calendar</p>
            <p className="mt-1 text-xs text-white/55">
              Connect Google Calendar so Shop Talk can sync interview meetings via Recall
              Calendar V2.
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            {loadingCalendar ? (
              <p className="text-sm text-recall-muted">Loading calendar status…</p>
            ) : calendarError ? (
              <p className="text-sm text-red-600">{calendarError}</p>
            ) : (
              <>
                {status ? (
                  <p className="text-xs text-recall-muted">
                    OAuth redirect URI:{" "}
                    <code className="break-all text-recall-navy">
                      {status.oauthRedirectUri}
                    </code>
                    {!status.recallConfigured ? (
                      <span className="mt-1 block text-amber-700">
                        Recall API key/region not set — OAuth can still run, but calendar
                        sync in Recall will stay pending until those env vars are filled.
                      </span>
                    ) : null}
                  </p>
                ) : null}

                <ProviderRow
                  title="Google Calendar"
                  configured={Boolean(status?.googleConfigured)}
                  connection={googleConnection}
                  busy={busyPlatform === "google_calendar"}
                  disconnecting={disconnectingId === googleConnection?.id}
                  onConnect={() => connect("google_calendar")}
                  onDisconnect={() =>
                    googleConnection && onDisconnect(googleConnection.id)
                  }
                />
              </>
            )}
          </div>
        </section>

        <section className="border border-recall-border bg-white shadow-[0_1px_0_rgba(0,21,53,0.04)]">
          <div className="border-b border-recall-border bg-recall-navy px-5 py-4 text-white">
            <p className="text-sm font-semibold">Scorecard criteria</p>
            <p className="mt-1 text-xs text-white/55">
              Each job posting has its own rubric.
            </p>
          </div>
          <div className="px-5 py-5 text-sm text-recall-muted">
            Edit criteria on the job detail page — open a posting from{" "}
            <Link href="/" className="font-medium text-recall-blue hover:text-recall-blue-bright">
              Home
            </Link>
            , then use the Scorecard criteria section at the bottom.
          </div>
        </section>

        <section className="border border-recall-border bg-white">
          <div className="border-b border-recall-border bg-recall-navy px-5 py-4 text-white">
            <p className="text-sm font-semibold">Environment checklist</p>
            <p className="mt-1 text-xs text-white/55">
              Configure in <code className="text-recall-sky">backend/.env</code> —
              secrets never ship to the browser.
            </p>
          </div>
          <ul className="divide-y divide-recall-border">
            {fields.map((field) => (
              <li
                key={field.label}
                className="flex items-start justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-recall-navy">
                    {field.label}
                  </p>
                  <p className="mt-1 text-xs text-recall-muted">{field.hint}</p>
                </div>
                <span className="shrink-0 rounded-full bg-recall-surface px-2.5 py-1 text-[11px] font-medium text-recall-muted">
                  Backend
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ProviderRow({
  title,
  configured,
  connection,
  busy,
  disconnecting,
  onConnect,
  onDisconnect,
}: {
  title: string;
  configured: boolean;
  connection?: CalendarConnection;
  busy: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connected = connection && connection.status !== "disconnected";

  return (
    <div className="flex flex-col gap-3 border border-recall-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-recall-navy">{title}</p>
        {connected ? (
          <>
            <p className="mt-1 truncate text-xs text-recall-muted">
              {connection.platformEmail || "Connected"}
              {connection.recallCalendarId
                ? ` · Recall ${connection.recallCalendarId}`
                : ""}
            </p>
            <p className="mt-1 text-[11px] font-medium capitalize text-recall-navy">
              Status: {connection.status}
              {connection.lastError ? ` — ${connection.lastError}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-recall-muted">
            {configured
              ? "Not connected"
              : "OAuth client env vars not configured yet"}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="border border-recall-border px-3 py-2 text-xs font-semibold text-recall-navy transition hover:border-recall-blue/40 disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={!configured || busy}
            className="bg-recall-blue px-3 py-2 text-xs font-semibold text-white transition hover:bg-recall-blue-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Redirecting…" : `Connect ${title}`}
          </button>
        )}
      </div>
    </div>
  );
}
