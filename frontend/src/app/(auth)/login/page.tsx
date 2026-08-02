"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthField, AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/lib/AuthProvider";

export default function LoginPage() {
  const { login, isAuthenticated, ready } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) router.replace("/");
  }, [ready, isAuthenticated, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Hiring managers — access interviews, candidates, and scorecards."
      footer={
        <>
          New to Shop Talk?{" "}
          <Link href="/signup" className="font-medium text-recall-blue hover:text-recall-blue-bright">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Work email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-recall-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-recall-blue-bright disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-xs text-recall-muted">
          Demo: <span className="font-mono">alex@shoptalk.example</span> /{" "}
          <span className="font-mono">password123</span>
        </p>
      </form>
    </AuthLayout>
  );
}
