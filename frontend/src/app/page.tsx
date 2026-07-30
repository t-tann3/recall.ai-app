"use client";

import { SendBotForm } from "@/components/dashboard/SendBotForm";
import { WorkspaceList } from "@/components/workspace/WorkspaceList";
import { useWorkspaces } from "@/lib/useWorkspaces";

export default function HomePage() {
  const { workspaces, ready } = useWorkspaces();

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-recall-navy md:text-3xl">
          AI Meeting Workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-recall-muted">
          A developer-facing layer on Recall.ai — paste a meeting URL, let a bot join,
          then open a Notion-style workspace with summary, transcript, insights, and
          raw API events.
        </p>
      </div>

      <section className="max-w-2xl">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
          New meeting
        </h2>
        <SendBotForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-recall-muted">
          Workspaces
        </h2>
        {ready ? <WorkspaceList workspaces={workspaces} /> : (
          <p className="text-sm text-recall-muted">Loading workspaces…</p>
        )}
      </section>
    </div>
  );
}
