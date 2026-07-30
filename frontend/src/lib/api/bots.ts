import { api } from "./client";
import { endpoints } from "./endpoints";
import type { CreateBotBody } from "./types";

export async function createBot(body: CreateBotBody) {
  const { data } = await api.post(endpoints.bots.create, body);
  return data;
}

export async function getBot(id: string) {
  const { data } = await api.get(endpoints.bots.byId(id));
  return data;
}
