export default function SettingsPage() {
  const fields = [
    {
      label: "RECALL_REGION",
      hint: "us-west-2 · us-east-1 · eu-central-1 · ap-northeast-1",
    },
    {
      label: "RECALL_API_KEY",
      hint: "Region-scoped key from the developers dashboard",
    },
    {
      label: "RECALL_WORKSPACE_VERIFICATION_SECRET",
      hint: "HMAC verification for webhooks (whsec_…)",
    },
    {
      label: "PUBLIC_API_BASE_URL",
      hint: "Stable public URL for the Node backend",
    },
  ] as const;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-recall-navy">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-sm text-recall-muted">
          Credentials live on the Node backend. This checklist is for setup — secrets
          never ship to the browser.
        </p>
      </div>

      <div className="max-w-2xl border border-recall-border bg-white">
        <div className="border-b border-recall-border bg-recall-navy px-5 py-4 text-white">
          <p className="text-sm font-semibold">Environment checklist</p>
          <p className="mt-1 text-xs text-white/55">
            Configure in <code className="text-recall-sky">backend/.env</code>
          </p>
        </div>
        <ul className="divide-y divide-recall-border">
          {fields.map((field) => (
            <li
              key={field.label}
              className="flex items-start justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="font-mono text-sm font-medium text-recall-navy">
                  {field.label}
                </p>
                <p className="mt-1 text-xs text-recall-muted">{field.hint}</p>
              </div>
              <span className="shrink-0 rounded-full bg-recall-surface px-2.5 py-1 text-[11px] font-medium text-recall-muted">
                Backend
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
