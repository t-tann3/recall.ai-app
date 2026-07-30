"use client";

import { TabEmpty } from "@/components/workspace/TabEmpty";
import { useCurrentWorkspace } from "@/components/workspace/useCurrentWorkspace";

export default function QuestionsTab() {
  const { workspace, ready } = useCurrentWorkspace();
  if (!ready || !workspace) return null;

  if (!workspace.questions.length) {
    return (
      <TabEmpty
        title="No open questions yet"
        body="Surface unresolved questions from the conversation for the team to answer later."
      />
    );
  }

  return (
    <ol className="max-w-3xl list-decimal space-y-3 pl-5">
      {workspace.questions.map((q) => (
        <li key={q} className="pl-1 text-sm leading-relaxed text-recall-navy">
          {q}
        </li>
      ))}
    </ol>
  );
}
