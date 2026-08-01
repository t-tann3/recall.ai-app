"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { createJobPosting, type JobPosting } from "@/lib/api/hr";

export function CreateJobPostingPanel({
  onCreated,
}: {
  onCreated: (job: JobPosting) => void;
}) {
  const { hiringManager } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [team, setTeam] = useState("");
  const [level, setLevel] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hiringManager?.id) {
      setError("You must be signed in to create a job posting");
      return;
    }

    setSubmitting(true);
    try {
      const job = await createJobPosting({
        title,
        team: team || undefined,
        level: level || undefined,
        location: location || undefined,
        description: description || undefined,
        status: "open",
        hiringManagerId: hiringManager.id,
      });
      onCreated(job);
      setTitle("");
      setTeam("");
      setLevel("");
      setLocation("");
      setDescription("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create job posting");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden border border-recall-border bg-white shadow-[0_1px_0_rgba(0,21,53,0.04)]">
      <div className="flex items-center justify-between gap-4 border-b border-recall-border bg-gradient-to-r from-recall-navy to-[#0a2a5c] px-5 py-4 text-white">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-recall-sky">
            Hiring pipeline
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Create a job posting
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Open a role, then schedule interviews against it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 bg-recall-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-recall-blue-bright"
        >
          {open ? "Close" : "New job posting"}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-recall-navy">Job title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Frontend Engineer"
              className="mt-1.5 w-full border border-recall-border bg-recall-surface px-3 py-2.5 text-sm outline-none focus:border-recall-blue focus:ring-2 focus:ring-recall-blue/20"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-recall-navy">Team</span>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="Engineering"
              className="mt-1.5 w-full border border-recall-border bg-recall-surface px-3 py-2.5 text-sm outline-none focus:border-recall-blue focus:ring-2 focus:ring-recall-blue/20"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-recall-navy">Level</span>
            <input
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="Senior"
              className="mt-1.5 w-full border border-recall-border bg-recall-surface px-3 py-2.5 text-sm outline-none focus:border-recall-blue focus:ring-2 focus:ring-recall-blue/20"
            />
          </label>
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-recall-navy">Location</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote"
              className="mt-1.5 w-full border border-recall-border bg-recall-surface px-3 py-2.5 text-sm outline-none focus:border-recall-blue focus:ring-2 focus:ring-recall-blue/20"
            />
          </label>
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-recall-navy">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this role owns and who they interview with…"
              className="mt-1.5 w-full resize-y border border-recall-border bg-recall-surface px-3 py-2.5 text-sm outline-none focus:border-recall-blue focus:ring-2 focus:ring-recall-blue/20"
            />
          </label>
          {error ? (
            <p className="md:col-span-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-recall-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-recall-blue-bright disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create job posting"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
