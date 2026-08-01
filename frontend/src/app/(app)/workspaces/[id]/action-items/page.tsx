"use client";

import { TabEmpty } from "@/components/workspace/TabEmpty";
import { useCurrentWorkspace } from "@/components/workspace/useCurrentWorkspace";

export default function ActionItemsTab() {
  const { workspace, ready } = useCurrentWorkspace();
  if (!ready || !workspace) return null;

  if (!workspace.actionItems.length) {
    return (
      <TabEmpty
        title="No action items yet"
        body="Extract owners and follow-ups from the transcript after the call ends."
      />
    );
  }

  return (
    <ul className="max-w-3xl divide-y divide-recall-border border border-recall-border bg-white">
      {workspace.actionItems.map((item) => (
        <li key={item.text} className="flex items-start gap-3 px-5 py-4">
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
              item.done
                ? "border-recall-green bg-recall-green/20"
                : "border-recall-border bg-white"
            }`}
            aria-hidden
          />
          <div>
            <p className="text-sm text-recall-navy">{item.text}</p>
            {item.owner ? (
              <p className="mt-1 text-xs text-recall-muted">Owner: {item.owner}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
