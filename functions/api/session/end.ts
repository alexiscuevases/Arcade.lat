import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import type { ReleaseResponse } from "../../../shared/types"
import { json, error } from "../../lib/response"
import { requireAuth } from "../../lib/auth"
import {
  getActiveSession,
  endSession,
  createSession,
  logUsage,
} from "../../lib/db"
import { createInstance, destroyInstance } from "../../../workers/vast-gpu-service"
import { getVastConfig } from "../../lib/vast"
import { getStub, doFetch } from "../../lib/do"

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const activeSession = await getActiveSession(env.DB, auth.userId)
  if (!activeSession) return error("No active session", 404)

  const stub = getStub(env)

  // Release GPU in DO, get next queued user (if any)
  const result = await doFetch(stub, "/release", { userId: auth.userId }) as ReleaseResponse

  // End session in D1
  await endSession(env.DB, activeSession.id)
  await logUsage(env.DB, auth.userId, "session_end", activeSession.id)

  // Destroy the freed instance
  if (result.freedInstanceId) {
    await destroyInstance(getVastConfig(env), result.freedInstanceId).catch(console.error)
  }

  // Assign next queued user if any
  if (result.nextEntry) {
    const { userId: nextUserId, gameId: nextGameId } = result.nextEntry
    try {
      const instance = await createInstance(getVastConfig(env))

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
    } catch {
      // Release the slot we reserved for next user
      await doFetch(stub, "/release", { userId: nextUserId }).catch(console.error)
    }
  }

  return json({ success: true })
}
