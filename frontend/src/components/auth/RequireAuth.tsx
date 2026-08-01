"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [ready, isAuthenticated, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-recall-surface text-sm text-recall-muted">
        Loading Shop Talk…
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
