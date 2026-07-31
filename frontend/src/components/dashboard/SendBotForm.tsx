"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWorkspaces } from "@/lib/useWorkspaces";

export function SendBotForm() {
  const router = useRouter();
  const { createWorkspace } = useWorkspaces();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setError("Paste a Google Meet, Zoom, or Teams URL.");
      return;
    }
    const workspace = createWorkspace(url);
    router.push(`/workspaces/${workspace.id}/summary`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-recall-border bg-white p-5 shadow-[0_1px_0_rgba(0,21,53,0.04)]"
    >
      <label htmlFor="meeting-url" className="block text-sm font-medium text-recall-navy">
        Meeting URL
      </label>
      <p className="mt-1 text-xs text-recall-muted">
        Recall joins the call. When it ends, a Shop Talk meeting is created automatically.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          id="meeting-url"
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="https://meet.google.com/..."
          className="min-w-0 flex-1 border border-recall-border bg-recall-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-recall-muted/60 focus:border-recall-blue focus:ring-2 focus:ring-recall-blue/20"
        />
        <button
          type="submit"
          className="shrink-0 bg-recall-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-recall-blue-bright"
        >
          Create meeting
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
