import { api } from "./client";
import { endpoints } from "./endpoints";

export type PublicHiringManager = {
  id: string;
  name: string;
  email: string;
  team: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicOrganization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicMembership = {
  id: string;
  organizationId: string;
  userId: string;
  role: "admin" | "recruiter" | "hiring_manager" | "interviewer";
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  ok: true;
  token: string;
  hiringManager: PublicHiringManager;
  organization: PublicOrganization;
  membership: PublicMembership;
};

export async function signup(body: {
  name: string;
  email: string;
  password: string;
  team?: string;
  title?: string;
  organizationName?: string;
}) {
  const { data } = await api.post<AuthResponse>(endpoints.auth.signup, body);
  return data;
}

export async function login(body: {
  email: string;
  password: string;
  organizationId?: string;
}) {
  const { data } = await api.post<AuthResponse>(endpoints.auth.login, body);
  return data;
}

export async function getMe() {
  const { data } = await api.get<{
    ok: true;
    hiringManager: PublicHiringManager;
    organization: PublicOrganization;
    membership: PublicMembership;
    role: PublicMembership["role"];
  }>(endpoints.auth.me);
  return data;
}
