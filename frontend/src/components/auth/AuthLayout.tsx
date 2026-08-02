"use client";

import Link from "next/link";
import { useState } from "react";

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
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="text-sm font-medium text-recall-navy">{label}</span>
      <span className="relative mt-1.5 block">
        <input
          id={id}
          type={inputType}
          value={value}
          required={required}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border border-recall-border bg-recall-surface px-3 py-2.5 text-sm outline-none transition focus:border-recall-blue focus:ring-2 focus:ring-recall-blue/20 ${
            isPassword ? "pr-11" : ""
          }`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-recall-muted transition hover:text-recall-navy"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </span>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.4" />
      <path d="M6.1 6.1C4 7.8 2.5 10.2 2 12c0 0 3.5 7 10 7a10.4 10.4 0 0 0 4.3-.9" />
    </svg>
  );
}
