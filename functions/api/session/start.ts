import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json, error } from "../../lib/response"
import { requireAuth } from "../../lib/auth"
import { getUserById, createSession, logUsage, getDailyUsageSeconds, DAILY_LIMIT_SECONDS } from "../../lib/db"
import { createInstance } from "../../../workers/vast-service"

const DO_URL = "https://queue-manager.internal"

function getStub(env: Env) {
  const id = env.QUEUE_MANAGER.idFromName("global")
  return env.QUEUE_MANAGER.get(id)
}

async function doFetch(stub: DurableObjectStub, path: string, body?: unknown) {
  const res = await stub.fetch(`${DO_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const user = await getUserById(env.DB, auth.userId)
  if (!user) return error("User not found", 404)

  const body = await request.json<{ gameId?: string }>().catch(() => ({}))
  const gameId = body.gameId ?? null
  if (!gameId) return error("gameId is required", 400)

  // Enforce daily play limit
  const limitSeconds = DAILY_LIMIT_SECONDS[user.plan]
  if (limitSeconds !== null) {
    const usedSeconds = await getDailyUsageSeconds(env.DB, user.id)
    if (usedSeconds >= limitSeconds) {
      return error(
        `Has alcanzado el límite diario de tu plan (${Math.floor(limitSeconds / 3600)}h). Actualiza tu plan para seguir jugando.`,
        403
      )
    }
  }

  const stub = getStub(env)

  // Ask DO to join (checks active/pending/queue/available)
  const result = await doFetch(stub, "/join", {
    userId: user.id,
    gameId,
    plan: user.plan,
  }) as
    | { type: "active"; session: { instance: { ip: string; port: number; token: string } } }
    | { type: "pending" }
    | { type: "queued"; position: number }
    | { type: "ready" }

  if (result.type === "active") {
    return json({
      status: "active",
      connection: result.session.instance,
    })
  }

  if (result.type === "pending") {
    return json({ status: "pending" })
  }

  if (result.type === "queued") {
    return json({ status: "queued", position: result.position })
  }

  // type === "ready" — GPU slot reserved, create instance
  try {
    const instance = await createInstance()

    await doFetch(stub, "/confirm", { userId: user.id, gameId, instance })

    const sessionId = crypto.randomUUID()
    await createSession(env.DB, {
      id: sessionId,
      user_id: user.id,
      game_id: gameId,
      instance_id: instance.id,
      instance_ip: instance.ip,
      instance_port: instance.port,
      instance_token: instance.token,
    })

    await logUsage(env.DB, user.id, "session_start", sessionId)

    return json({
      status: "active",
      connection: { ip: instance.ip, port: instance.port, token: instance.token },
    })
  } catch (err) {
    // Release the reserved slot on failure
    await doFetch(stub, "/release", { userId: user.id })
    return error("Failed to provision GPU instance", 503)
  }
}
