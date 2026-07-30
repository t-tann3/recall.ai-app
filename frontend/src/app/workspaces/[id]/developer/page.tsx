"use client";

import { useCurrentWorkspace } from "@/components/workspace/useCurrentWorkspace";

export default function DeveloperTab() {
  const { workspace, ready } = useCurrentWorkspace();
  if (!ready || !workspace) return null;

  const { developer } = workspace;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="text-sm text-recall-muted">
        Raw Recall artifacts and webhook timeline — this tab is what makes the demo
        developer-facing instead of another summarizer.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Bot ID", value: developer.botId },
          { label: "Recording ID", value: developer.recordingId },
          { label: "Transcript ID", value: developer.transcriptId },
        ].map((field) => (
          <div key={field.label} className="border border-recall-border bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-recall-muted">
              {field.label}
            </p>
            <p className="mt-1 truncate font-mono text-sm text-recall-navy">
              {field.value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="border border-recall-border bg-recall-navy text-white">
        <div className="border-b border-white/10 px-5 py-3">
          <p className="text-sm font-semibold">Webhook / lifecycle events</p>
        </div>
        <ul className="divide-y divide-white/10 font-mono text-xs">
          {developer.events.map((event) => (
            <li key={`${event.type}-${event.at}`} className="px-5 py-3">
              <p className="text-recall-sky">{event.type}</p>
              <p className="mt-1 text-white/45">{event.at}</p>
              <p className="mt-1 text-white/70">{event.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
