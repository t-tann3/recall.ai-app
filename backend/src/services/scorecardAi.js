import { config } from "../config.js";

function flattenTranscript(lines) {
  return (lines || [])
    .map((line) => {
      const m = Math.floor((line.startSeconds || 0) / 60);
      const s = Math.floor((line.startSeconds || 0) % 60);
      const ts = `${m}:${String(s).padStart(2, "0")}`;
      return `[${ts}] ${line.speaker}: ${line.text}`;
    })
    .join("\n");
}

/**
 * Heuristic draft when OPENAI_API_KEY is not configured (still useful for demos).
 */
export function heuristicScorecard({ criteriaItems, transcriptLines, jobTitle, interviewType }) {
  const text = flattenTranscript(transcriptLines).toLowerCase();
  const criteriaScores = (criteriaItems || []).map((item) => {
    const tokens = `${item.label} ${item.description}`
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    const hits = tokens.filter((t) => text.includes(t)).length;
    const score = Math.min(5, Math.max(2, 2 + hits));
    const evidenceLine = (transcriptLines || []).find((line) =>
      tokens.some((t) => line.text.toLowerCase().includes(t)),
    );
    return {
      criteriaId: item.id,
      label: item.label,
      score,
      evidence: evidenceLine
        ? `"${evidenceLine.text}" — ${evidenceLine.speaker}`
        : "Limited direct evidence in transcript; score is provisional.",
    };
  });

  const avg =
    criteriaScores.length > 0
      ? criteriaScores.reduce((sum, c) => sum + c.score, 0) / criteriaScores.length
      : 3;
  const overall = Math.round(avg);

  let recommendation = "lean_hire";
  if (overall >= 5) recommendation = "strong_hire";
  else if (overall >= 4) recommendation = "hire";
  else if (overall >= 3) recommendation = "lean_hire";
  else if (overall >= 2) recommendation = "lean_no";
  else recommendation = "no_hire";

  return {
    recommendation,
    score: overall,
    criteriaScores,
    strengths:
      "Candidate provided concrete examples and stayed engaged throughout the conversation.",
    concerns:
      "Some answers could go deeper on metrics or outcomes; probe further in the next round.",
    notes: `Draft scorecard for ${interviewType || "interview"} (${jobTitle || "role"}) generated without OpenAI — add OPENAI_API_KEY for LLM scoring.`,
    source: "ai",
  };
}

/**
 * Generate a structured scorecard from transcript + hiring manager criteria.
 */
export async function generateScorecardFromTranscript({
  criteriaItems,
  transcriptLines,
  jobTitle,
  interviewType,
  candidateName,
}) {
  if (!config.openai.apiKey) {
    return heuristicScorecard({
      criteriaItems,
      transcriptLines,
      jobTitle,
      interviewType,
    });
  }

  const transcriptText = flattenTranscript(transcriptLines);
  if (!transcriptText.trim()) {
    throw Object.assign(new Error("Transcript is empty — nothing to score"), { status: 400 });
  }

  const criteriaBlock = (criteriaItems || [])
    .map(
      (c, i) =>
        `${i + 1}. id=${c.id}\n   label=${c.label}\n   description=${c.description}\n   weight=${c.weight}`,
    )
    .join("\n");

  const system = `You are an interview scoring assistant for hiring managers.
Score ONLY from the transcript. Do not invent facts.
Return strict JSON matching the schema. recommendation must be one of:
strong_hire, hire, lean_hire, lean_no, no_hire.
Each criteria score must be an integer 1-5.
evidence must be a short quote or paraphrase tied to the transcript, or say evidence is missing.`;

  const user = `Candidate: ${candidateName || "Unknown"}
Role: ${jobTitle || "Unknown"}
Interview type: ${interviewType || "interview"}

Criteria:
${criteriaBlock}

Transcript:
${transcriptText}

Respond with JSON:
{
  "recommendation": "hire",
  "score": 4,
  "criteriaScores": [
    { "criteriaId": "...", "label": "...", "score": 4, "evidence": "..." }
  ],
  "strengths": "...",
  "concerns": "...",
  "notes": "..."
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.error?.message || data?.message || `OpenAI request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: 502, data });
  }

  const content = data.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = JSON.parse(content || "{}");
  } catch {
    throw Object.assign(new Error("Model returned invalid JSON"), { status: 502 });
  }

  const allowed = new Set(["strong_hire", "hire", "lean_hire", "lean_no", "no_hire"]);
  const recommendation = allowed.has(parsed.recommendation)
    ? parsed.recommendation
    : "lean_hire";

  const criteriaById = new Map((criteriaItems || []).map((c) => [c.id, c]));
  const criteriaScores = Array.isArray(parsed.criteriaScores)
    ? parsed.criteriaScores.map((row) => {
        const meta = criteriaById.get(row.criteriaId);
        const score = Math.min(5, Math.max(1, Number(row.score) || 3));
        return {
          criteriaId: row.criteriaId || meta?.id || "",
          label: row.label || meta?.label || "Criterion",
          score,
          evidence: String(row.evidence || "").trim() || "No evidence cited.",
        };
      })
    : [];

  const scoreNum = Number(parsed.score);
  return {
    recommendation,
    score: Number.isFinite(scoreNum) ? Math.min(5, Math.max(1, Math.round(scoreNum))) : null,
    criteriaScores,
    strengths: String(parsed.strengths || "").trim(),
    concerns: String(parsed.concerns || "").trim(),
    notes: String(parsed.notes || "").trim(),
    source: "ai",
  };
}
