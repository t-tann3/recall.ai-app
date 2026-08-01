"use client";

import Link from "next/link";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-recall-surface text-recall-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(43,98,255,0.16),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(168,85,247,0.1),transparent_50%),linear-gradient(180deg,#e8eef8_0%,#f1f4f9_45%,#f5f7fb_100%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link href="/login" className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-recall-blue text-sm font-bold text-white shadow-[0_0_24px_rgba(43,98,255,0.45)]">
            S
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-recall-navy">
              Shop Talk
            </p>
            <p className="text-[11px] text-recall-muted">For hiring managers</p>
          </div>
        </Link>

        <div className="border border-recall-border bg-white p-6 shadow-[0_1px_0_rgba(0,21,53,0.04)]">
          <h1 className="text-2xl font-semibold tracking-tight text-recall-navy">
            {title}
          </h1>
          <p className="mt-2 text-sm text-recall-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-recall-muted">{footer}</p>
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-recall-navy">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full border border-recall-border bg-recall-surface px-3 py-2.5 text-sm outline-none transition focus:border-recall-blue focus:ring-2 focus:ring-recall-blue/20"
      />
    </label>
  );
}
