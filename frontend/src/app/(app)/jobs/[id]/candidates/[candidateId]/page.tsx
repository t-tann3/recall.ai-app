"use client";

import { Suspense } from "react";
import CandidateEvaluationPage from "./CandidateEvaluationPage";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-8 text-sm text-recall-muted">Loading evaluation…</div>}
    >
      <CandidateEvaluationPage />
    </Suspense>
  );
}
