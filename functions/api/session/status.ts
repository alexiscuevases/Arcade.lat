import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json } from "../../lib/response"
import { requireAuth } from "../../lib/auth"
import { getActiveSession, getUserById, getDailyUsageSeconds, DAILY_LIMIT_SECONDS } from "../../lib/db"

const DO_URL = "https://queue-manager.internal"

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const id = env.QUEUE_MANAGER.idFromName("global")
  const stub = env.QUEUE_MANAGER.get(id)

  const [res, user] = await Promise.all([
    stub.fetch(`${DO_URL}/status?userId=${encodeURIComponent(auth.userId)}`),
    getUserById(env.DB, auth.userId),
  ])

  if (!res.ok) {
    return json({ error: "Queue manager unavailable" }, 503)
  }

  const status = await res.json() as
    | { type: "active"; session: { gameId: string; instance: { ip: string; port: number; token: string }; startedAt: number } }
    | { type: "pending"; gameId: string }
    | { type: "queued"; position: number; gameId: string }
    | { type: "idle" }

  // Compute daily usage for this user
  const plan = user?.plan ?? "FREE"
  const limitSeconds = DAILY_LIMIT_SECONDS[plan] ?? null
  const usedSeconds = await getDailyUsageSeconds(env.DB, auth.userId)
  const dailyInfo = {
    dailyUsedSeconds: usedSeconds,
    dailyLimitSeconds: limitSeconds,
  }

  if (status.type === "active") {
    // Cross-check with D1 — DO may be out of sync if session was ended outside normal flow
    const dbSession = await getActiveSession(env.DB, auth.userId)
    if (!dbSession) {
      // DO thinks it's active but D1 disagrees — release the DO slot silently
      await stub.fetch(`${DO_URL}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: auth.userId }),
      }).catch(() => {})
      return json({ status: "idle", ...dailyInfo })
    }
    return json({
      status: "active",
      gameId: status.session.gameId,
      connection: status.session.instance,
      startedAt: status.session.startedAt,
      ...dailyInfo,
    })
  }

  if (status.type === "queued") {
    return json({ status: "queued", position: status.position, gameId: status.gameId, ...dailyInfo })
  }

  if (status.type === "pending") {
    return json({ status: "pending", gameId: status.gameId, ...dailyInfo })
  }

  return json({ status: "idle", ...dailyInfo })
}
