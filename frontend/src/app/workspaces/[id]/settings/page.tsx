"use client";

import { useCurrentWorkspace } from "@/components/workspace/useCurrentWorkspace";

export default function WorkspaceSettingsTab() {
  const { workspace, ready } = useCurrentWorkspace();
  if (!ready || !workspace) return null;

  const rows = [
    { label: "Workspace ID", value: workspace.id },
    { label: "Bot name", value: workspace.botName },
    { label: "Platform", value: workspace.platform },
    { label: "Meeting URL", value: workspace.meetingUrl },
    { label: "Created", value: new Date(workspace.createdAt).toLocaleString() },
    { label: "Status", value: workspace.status },
  ];

  return (
    <div className="max-w-2xl border border-recall-border bg-white">
      <div className="border-b border-recall-border px-5 py-4">
        <h2 className="text-sm font-semibold text-recall-navy">Workspace settings</h2>
        <p className="mt-1 text-xs text-recall-muted">
          Per-meeting metadata. Global Recall credentials stay under app Settings.
        </p>
      </div>
      <ul className="divide-y divide-recall-border">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-xs font-medium text-recall-muted">{row.label}</span>
            <span className="truncate text-sm text-recall-navy sm:max-w-[60%] sm:text-right">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
