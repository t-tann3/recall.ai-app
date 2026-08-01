"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthField, AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/lib/AuthProvider";

export default function SignupPage() {
  const { signup, isAuthenticated, ready } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [team, setTeam] = useState("");
  const [title, setTitle] = useState("");
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
      await signup({
        name,
        email,
        password,
        team: team || undefined,
        title: title || undefined,
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Sign up as a hiring manager to run interviews on Shop Talk."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-recall-blue hover:text-recall-blue-bright">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField
          id="name"
          label="Full name"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
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
          autoComplete="new-password"
        />
        <AuthField
          id="title"
          label="Title (optional)"
          value={title}
          onChange={setTitle}
          required={false}
        />
        <AuthField
          id="team"
          label="Team (optional)"
          value={team}
          onChange={setTeam}
          required={false}
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
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
