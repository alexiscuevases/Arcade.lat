import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import type { SessionStatus, ReleaseResponse } from "../../../shared/types"
import { json } from "../../lib/response"
import { requireAuth } from "../../lib/auth"
import { getActiveSession, getUserById, getDailyUsageSeconds, DAILY_LIMIT_SECONDS, endSession, logUsage, createSession } from "../../lib/db"
import { getStub, doFetch } from "../../lib/do"
import { DO_URL } from "../../../shared/settings"
import { createInstance, destroyInstance } from "../../../workers/vast-gpu-service"
import { getVastConfig } from "../../lib/vast"

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const stub = getStub(env)

  const [res, user] = await Promise.all([
    stub.fetch(`${DO_URL}/status?userId=${encodeURIComponent(auth.userId)}`),
    getUserById(env.DB, auth.userId),
  ])

  if (!res.ok) {
    return json({ error: "Queue manager unavailable" }, 503)
  }

  const status = await res.json() as SessionStatus

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

    // Auto-terminate session if daily limit has been reached
    if (limitSeconds !== null && usedSeconds >= limitSeconds) {
      const result = await doFetch(stub, "/release", { userId: auth.userId }) as ReleaseResponse
      await endSession(env.DB, dbSession.id)
      await logUsage(env.DB, auth.userId, "session_end_limit", dbSession.id)

      if (result.freedInstanceId) {
        destroyInstance(getVastConfig(env), result.freedInstanceId).catch(console.error)
      }

      if (result.nextEntry) {
        const { userId: nextUserId, gameId: nextGameId } = result.nextEntry
        createInstance(getVastConfig(env)).then(async (instance) => {
          await doFetch(stub, "/confirm", { userId: nextUserId, gameId: nextGameId, instance })
          const sessionId = crypto.randomUUID()
          await createSession(env.DB, {
            id: sessionId,
            user_id: nextUserId,
            game_id: nextGameId,
            instance_id: instance.id,
            instance_ip: instance.ip,
            instance_port: instance.port,
            instance_token: instance.token,
          })
          await logUsage(env.DB, nextUserId, "session_start_from_queue", sessionId)
        }).catch(async () => {
          await doFetch(stub, "/release", { userId: result.nextEntry!.userId }).catch(console.error)
        })
      }

      return json({ status: "limit_reached", ...dailyInfo })
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
