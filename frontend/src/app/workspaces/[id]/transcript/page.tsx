"use client";

import { TabEmpty } from "@/components/workspace/TabEmpty";
import { useCurrentWorkspace } from "@/components/workspace/useCurrentWorkspace";

export default function TranscriptTab() {
  const { workspace, ready } = useCurrentWorkspace();
  if (!ready || !workspace) return null;

  if (!workspace.transcript?.length) {
    return (
      <TabEmpty
        title="No transcript yet"
        body="Fetch the transcript download URL after transcript.done and render speaker turns here."
      />
    );
  }

  return (
    <div className="max-w-3xl border border-recall-border bg-white">
      <ul className="divide-y divide-recall-border">
        {workspace.transcript.map((line, i) => (
          <li key={`${line.start}-${i}`} className="flex gap-4 px-5 py-4">
            <span className="w-14 shrink-0 font-mono text-xs text-recall-muted">
              {line.start}
            </span>
            <div>
              <p className="text-xs font-semibold text-recall-blue">{line.speaker}</p>
              <p className="mt-1 text-sm leading-relaxed text-recall-navy">{line.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
