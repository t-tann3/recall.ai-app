"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getScorecardCriteria,
  saveScorecardCriteria,
  type ScorecardCriterion,
} from "@/lib/api/scorecard";
import {
  SCORECARD_OPTIONS,
  getScorecardOption,
} from "@/lib/scorecardOptions";

type EditableCriterion = {
  key: string;
  id?: string;
  label: string;
  description: string;
  weight: string;
};

function toEditable(items: ScorecardCriterion[]): EditableCriterion[] {
  return items.map((item, index) => ({
    key: item.id || `row-${index}`,
    id: item.id,
    label: item.label,
    description: item.description || "",
    weight: String(item.weight ?? 1),
  }));
}

function optionLabelsForRow(row: EditableCriterion, allRows: EditableCriterion[]) {
  const used = new Set(
    allRows.filter((r) => r.key !== row.key && r.label).map((r) => r.label),
  );
  const labels: string[] = SCORECARD_OPTIONS.map((o) => o.label).filter(
    (label) => !used.has(label) || label === row.label,
  );
  if (row.label && !labels.includes(row.label)) {
    labels.unshift(row.label);
  }
  return labels;
}

export function JobScorecardCriteriaEditor({ jobPostingId }: { jobPostingId: string }) {
  const [rows, setRows] = useState<EditableCriterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [openaiConfigured, setOpenaiConfigured] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScorecardCriteria(jobPostingId);
      setOpenaiConfigured(data.openaiConfigured);
      setRows(toEditable(data.criteria.items));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load criteria");
    } finally {
      setLoading(false);
    }
  }, [jobPostingId]);

  useEffect(() => {
    load();
  }, [load]);

  function updateRow(key: string, patch: Partial<Omit<EditableCriterion, "key">>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
    setSaved(false);
  }

  function selectCriterion(key: string, label: string) {
    const option = getScorecardOption(label);
    updateRow(key, {
      label,
      description: option?.description ?? "",
    });
  }

  function addRow() {
    const used = new Set(rows.map((r) => r.label));
    const next = SCORECARD_OPTIONS.find((o) => !used.has(o.label));
    if (!next) {
      setError("All scorecard options are already on this rubric");
      return;
    }
    setRows((current) => [
      ...current,
      {
        key: `new-${Date.now()}`,
        label: next.label,
        description: next.description,
        weight: "1",
      },
    ]);
    setError(null);
    setSaved(false);
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
    setSaved(false);
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const items = rows
        .map((row) => ({
          id: row.id,
          label: row.label.trim(),
          description: row.description.trim(),
          weight: Number(row.weight) || 1,
        }))
        .filter((row) => row.label);

      if (items.length === 0) {
        throw new Error("Add at least one criterion");
      }

      const savedCriteria = await saveScorecardCriteria({
        jobPostingId,
        items,
      });
      setRows(toEditable(savedCriteria.items));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save criteria");
    } finally {
      setSaving(false);
    }
  }

  const canAdd = rows.length < SCORECARD_OPTIONS.length;

  return (
    <section className="mt-6 border border-recall-border bg-white p-5 shadow-[0_1px_0_rgba(0,21,53,0.04)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-recall-navy">Scorecard criteria</h2>
          <p className="mt-1 text-xs text-recall-muted">
            Rubric for this job only — used when generating interview scorecards.
          </p>
        </div>
        {!loading ? (
          <p className="text-[11px] text-recall-muted">
            {openaiConfigured
              ? "OpenAI configured"
              : "No OPENAI_API_KEY — heuristic draft until you add one"}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-recall-muted">Loading criteria…</p>
      ) : (
        <div className="mt-4 space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <ul className="space-y-3">
            {rows.map((row) => {
              const options = optionLabelsForRow(row, rows);
              return (
                <li key={row.key} className="space-y-2 border border-recall-border p-3">
                  <div className="flex gap-2">
                    <select
                      value={row.label}
                      onChange={(e) => selectCriterion(row.key, e.target.value)}
                      className="w-full border border-recall-border bg-white px-3 py-2 text-sm outline-none focus:border-recall-blue"
                    >
                      {!row.label ? (
                        <option value="">Select criterion…</option>
                      ) : null}
                      {options.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={row.weight}
                      onChange={(e) => updateRow(row.key, { weight: e.target.value })}
                      placeholder="1"
                      className="w-16 border border-recall-border px-2 py-2 text-sm outline-none focus:border-recall-blue"
                      title="Weight"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className="px-2 text-xs text-recall-muted hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    value={row.description}
                    onChange={(e) => updateRow(row.key, { description: e.target.value })}
                    placeholder="What good looks like for this criterion"
                    rows={2}
                    className="w-full resize-y border border-recall-border px-3 py-2 text-sm outline-none focus:border-recall-blue"
                  />
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addRow}
              disabled={!canAdd}
              className="border border-recall-border px-3 py-2 text-xs font-semibold text-recall-navy hover:border-recall-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add criterion
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="bg-recall-blue px-3 py-2 text-xs font-semibold text-white hover:bg-recall-blue-bright disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save criteria"}
            </button>
            {saved ? <span className="text-xs text-emerald-700">Saved</span> : null}
          </div>
        </div>
      )}
    </section>
  );
}
