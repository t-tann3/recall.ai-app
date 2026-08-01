"use client";

import { TabEmpty } from "@/components/workspace/TabEmpty";
import { useCurrentWorkspace } from "@/components/workspace/useCurrentWorkspace";

export default function InsightsTab() {
  const { workspace, ready } = useCurrentWorkspace();
  if (!ready || !workspace) return null;

  if (!workspace.insights.length) {
    return (
      <TabEmpty
        title="No insights yet"
        body="Derive decisions, risks, and opportunities from the transcript once the meeting is ready."
      />
    );
  }

  return (
    <ul className="max-w-3xl space-y-3">
      {workspace.insights.map((insight) => (
        <li
          key={insight}
          className="border-l-2 border-recall-violet bg-white px-5 py-4 text-sm leading-relaxed text-recall-navy"
        >
          {insight}
        </li>
      ))}
    </ul>
  );
}
