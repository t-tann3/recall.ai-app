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

export type AuthResponse = {
  ok: true;
  token: string;
  hiringManager: PublicHiringManager;
};

export async function signup(body: {
  name: string;
  email: string;
  password: string;
  team?: string;
  title?: string;
}) {
  const { data } = await api.post<AuthResponse>(endpoints.auth.signup, body);
  return data;
}

export async function login(body: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>(endpoints.auth.login, body);
  return data;
}

export async function getMe() {
  const { data } = await api.get<{ ok: true; hiringManager: PublicHiringManager }>(
    endpoints.auth.me,
  );
  return data;
}
