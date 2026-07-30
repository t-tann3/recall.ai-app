"use client";

import { useParams } from "next/navigation";
import { useWorkspaces } from "@/lib/useWorkspaces";

export function useCurrentWorkspace() {
  const params = useParams<{ id: string }>();
  const { getWorkspace, ready } = useWorkspaces();
  return { workspace: ready ? getWorkspace(params.id) : null, ready };
}
