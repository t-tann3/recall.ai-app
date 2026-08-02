"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useWorkspaces } from "@/lib/useWorkspaces";
import { statusLabel } from "@/lib/workspaces";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { workspaces, ready } = useWorkspaces();
  const { hiringManager, logout } = useAuth();
  const inWorkspace = pathname.startsWith("/workspaces/");

  return (
    <div className="relative min-h-screen overflow-hidden bg-recall-surface text-recall-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(43,98,255,0.14),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(168,85,247,0.08),transparent_50%),linear-gradient(180deg,#e8eef8_0%,#f1f4f9_45%,#f5f7fb_100%)]"
      />

      <div className="relative z-10 flex min-h-screen">
        <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-recall-navy text-white">
          <div className="border-b border-white/10 px-5 py-5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-recall-blue text-sm font-bold tracking-tight shadow-[0_0_24px_rgba(43,98,255,0.45)]">
                S
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight">Shop Talk</p>
                <p className="text-[11px] text-white/45">Conversations, organized</p>
              </div>
            </Link>
          </div>

          <div className="flex flex-1 flex-col gap-1 overflow-auto p-3">
            <Link
              href="/"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                pathname === "/"
                  ? "bg-white/10 text-white"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              Home
            </Link>

            <p className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Captures
            </p>
            {ready ? (
              workspaces.length === 0 ? (
                <p className="px-3 py-2 text-xs text-white/40">None yet</p>
              ) : (
                workspaces.slice(0, 8).map((ws) => {
                  const active = pathname.startsWith(`/workspaces/${ws.id}`);
                  return (
                    <Link
                      key={ws.id}
                      href={`/workspaces/${ws.id}/summary`}
                      className={`rounded-md px-3 py-2 transition ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/65 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="block truncate text-sm font-medium">
                        {ws.title}
                      </span>
                      <span className="block text-[11px] text-white/40">
                        {statusLabel(ws.status)} · {ws.platform}
                      </span>
                    </Link>
                  );
                })
              )
            ) : (
              <p className="px-3 py-2 text-xs text-white/40">Loading…</p>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            {hiringManager ? (
              <div className="space-y-1">
                <Link
                  href="/settings"
                  className={`flex items-center gap-3 rounded-md px-2 py-2 transition ${
                    pathname === "/settings"
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                  aria-label="Open account settings"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-recall-blue text-sm font-semibold text-white shadow-[0_0_16px_rgba(43,98,255,0.35)]">
                    {hiringManager.name.trim().charAt(0).toUpperCase() || "U"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">
                      {hiringManager.name}
                    </span>
                    <span className="block truncate text-[11px] text-white/40">
                      {hiringManager.email}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                      Settings
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-md px-3 py-1.5 text-left text-[11px] font-medium text-recall-sky hover:bg-white/5 hover:text-white"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/settings"
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  pathname === "/settings"
                    ? "bg-white/10 text-white"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                Settings
              </Link>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {!inWorkspace ? (
            <header className="flex h-14 items-center justify-between border-b border-recall-border/80 bg-white/70 px-6 backdrop-blur-md">
              <p className="text-sm text-recall-muted">
                Your hiring command center — roles, interviews, and outcomes
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-recall-blue/10 px-2.5 py-1 text-[11px] font-medium text-recall-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-recall-green" />
                Shop Talk
              </span>
            </header>
          ) : null}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
