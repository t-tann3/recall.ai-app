import { api } from "./client";
import { endpoints } from "./endpoints";
import type { HealthResponse } from "./types";

export async function getHealth() {
  const { data } = await api.get<HealthResponse>(endpoints.health);
  return data;
}
