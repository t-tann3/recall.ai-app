"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { useWorkspaces } from "@/lib/useWorkspaces";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const { getWorkspace, ready } = useWorkspaces();

  if (!ready) {
    return (
      <div className="p-8 text-sm text-recall-muted">Loading workspace…</div>
    );
  }

  const workspace = getWorkspace(params.id);
  if (!workspace) {
    return (
      <div className="p-8">
        <p className="text-sm font-medium text-recall-navy">Workspace not found</p>
        <Link href="/" className="mt-3 inline-block text-sm text-recall-blue">
          ← Back to all workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader workspace={workspace} />
      <div className="flex-1 p-6 md:p-8">{children}</div>
    </div>
  );
}
