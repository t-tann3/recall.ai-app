"use client";

import { TabEmpty } from "@/components/workspace/TabEmpty";
import { useCurrentWorkspace } from "@/components/workspace/useCurrentWorkspace";

export default function SummaryTab() {
  const { workspace, ready } = useCurrentWorkspace();
  if (!ready || !workspace) return null;

  if (!workspace.summary) {
    return (
      <TabEmpty
        title="Summary pending"
        body="After transcript.done, generate an AI summary and store it on this workspace. Demo kickoff already has one — open Product Kickoff from the sidebar."
      />
    );
  }

  return (
    <article className="max-w-3xl border border-recall-border bg-white p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-recall-muted">
        Summary
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-recall-navy">
        {workspace.summary}
      </p>
    </article>
  );
}
