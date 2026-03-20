// Durable Object stub helpers — shared across session handlers

import type { Env } from "./env"
import { DO_URL } from "../../shared/settings"

export function getStub(env: Env) {
  const id = env.QUEUE_MANAGER.idFromName("global")
  return env.QUEUE_MANAGER.get(id)
}

export async function doFetch(stub: DurableObjectStub, path: string, body?: unknown) {
  const res = await stub.fetch(`${DO_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}
