"use client";

import { Suspense } from "react";
import SettingsPageContent from "./SettingsPageContent";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-sm text-recall-muted">Loading settings…</div>}
    >
      <SettingsPageContent />
    </Suspense>
  );
}
