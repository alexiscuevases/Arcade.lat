import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json } from "../../lib/response"
import { requireAuth } from "../../lib/auth"

const DO_URL = "https://queue-manager.internal"

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const id = env.QUEUE_MANAGER.idFromName("global")
  const stub = env.QUEUE_MANAGER.get(id)

  const res = await stub.fetch(
    `${DO_URL}/status?userId=${encodeURIComponent(auth.userId)}`
  )

  if (!res.ok) {
    return json({ error: "Queue manager unavailable" }, 503)
  }

  const status = await res.json() as
    | { type: "active"; session: { instance: { ip: string; port: number; token: string }; startedAt: number } }
    | { type: "pending" }
    | { type: "queued"; position: number }
    | { type: "idle" }

  if (status.type === "active") {
    return json({
      status: "active",
      connection: status.session.instance,
      startedAt: status.session.startedAt,
    })
  }

  if (status.type === "queued") {
    return json({ status: "queued", position: status.position })
  }

  return json({ status: status.type }) // "pending" | "idle"
}
