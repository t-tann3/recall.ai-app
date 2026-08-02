/** Shared catalog of scorecard criteria for job rubrics. */
export const SCORECARD_OPTIONS = [
  {
    label: "Communication",
    description: "Clear, concise answers; listens and responds appropriately.",
  },
  {
    label: "Role fit",
    description: "Experience and motivation align with the role requirements.",
  },
  {
    label: "Problem solving",
    description:
      "Structures problems, reasons through tradeoffs, reaches sound conclusions.",
  },
  {
    label: "Customer empathy",
    description: "Shows care for guests and handles conflict calmly.",
  },
  {
    label: "Technical depth",
    description: "Strong fundamentals and system thinking for the role.",
  },
  {
    label: "Product judgment",
    description: "Balances UX, performance, and delivery tradeoffs.",
  },
  {
    label: "Collaboration",
    description: "Works well with cross-functional partners and teammates.",
  },
  {
    label: "Reliability",
    description: "Dependable, follows process, owns follow-through.",
  },
  {
    label: "Leadership",
    description: "Influences others, owns outcomes, raises the bar for the team.",
  },
  {
    label: "Ownership",
    description: "Takes initiative, follows through, and drives results.",
  },
] as const;

export type ScorecardOptionLabel = (typeof SCORECARD_OPTIONS)[number]["label"];

export function getScorecardOption(label: string) {
  return SCORECARD_OPTIONS.find((option) => option.label === label) ?? null;
}
