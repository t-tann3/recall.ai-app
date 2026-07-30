import Link from "next/link";
import { statusLabel, type MeetingWorkspace } from "@/lib/workspaces";

export function StatusPill({ status }: { status: MeetingWorkspace["status"] }) {
  const styles: Record<MeetingWorkspace["status"], string> = {
    joining: "bg-recall-sky/15 text-recall-blue",
    in_call: "bg-recall-violet/15 text-recall-violet",
    processing: "bg-amber-100 text-amber-800",
    ready: "bg-recall-green/15 text-emerald-800",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function WorkspaceList({ workspaces }: { workspaces: MeetingWorkspace[] }) {
  if (workspaces.length === 0) {
    return (
      <div className="border border-dashed border-recall-border bg-white/60 px-6 py-12 text-center">
        <p className="text-sm font-medium text-recall-navy">No workspaces yet</p>
        <p className="mt-1 text-sm text-recall-muted">
          Paste a meeting URL above to open your first one.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-recall-border border border-recall-border bg-white">
      {workspaces.map((ws) => (
        <li key={ws.id}>
          <Link
            href={`/workspaces/${ws.id}/summary`}
            className="flex flex-col gap-2 px-5 py-4 transition hover:bg-recall-surface/80 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-recall-navy">{ws.title}</p>
              <p className="mt-0.5 truncate text-xs text-recall-muted">{ws.meetingUrl}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-recall-muted">{ws.platform}</span>
              <StatusPill status={ws.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
