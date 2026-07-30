"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusPill } from "@/components/workspace/WorkspaceList";
import type { MeetingWorkspace } from "@/lib/workspaces";

export const WORKSPACE_TABS = [
  { slug: "summary", label: "Summary" },
  { slug: "transcript", label: "Transcript" },
  { slug: "insights", label: "Insights" },
  { slug: "action-items", label: "Action Items" },
  { slug: "questions", label: "Questions" },
  { slug: "developer", label: "Developer View" },
  { slug: "settings", label: "Settings" },
] as const;

export type WorkspaceTabSlug = (typeof WORKSPACE_TABS)[number]["slug"];

export function WorkspaceHeader({ workspace }: { workspace: MeetingWorkspace }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-recall-border bg-white/80 backdrop-blur-md">
      <div className="px-6 pt-6 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-recall-muted">
              Meeting Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-recall-navy">
              {workspace.title}
            </h1>
            <p className="mt-1 max-w-2xl truncate text-sm text-recall-muted">
              {workspace.meetingUrl}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-recall-muted">{workspace.platform}</span>
            <StatusPill status={workspace.status} />
          </div>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto pb-px">
          {WORKSPACE_TABS.map((tab) => {
            const href = `/workspaces/${workspace.id}/${tab.slug}`;
            const active = pathname === href || pathname.endsWith(`/${tab.slug}`);
            return (
              <Link
                key={tab.slug}
                href={href}
                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-recall-blue text-recall-blue"
                    : "border-transparent text-recall-muted hover:text-recall-navy"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
