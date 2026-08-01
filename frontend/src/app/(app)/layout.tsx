import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WorkspacesProvider } from "@/lib/WorkspacesProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <WorkspacesProvider>
        <DashboardShell>{children}</DashboardShell>
      </WorkspacesProvider>
    </RequireAuth>
  );
}
