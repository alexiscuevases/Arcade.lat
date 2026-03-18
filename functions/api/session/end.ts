import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json, error } from "../../lib/response"
import { requireAuth } from "../../lib/auth"
import {
  getActiveSession,
  endSession,
  createSession,
  logUsage,
} from "../../lib/db"
import { createInstance, destroyInstance } from "../../../workers/vast-service"

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

  const activeSession = await getActiveSession(env.DB, auth.userId)
  if (!activeSession) return error("No active session", 404)

  const stub = getStub(env)

  // Release GPU in DO, get next queued user (if any)
  const result = await doFetch(stub, "/release", { userId: auth.userId }) as {
    freedInstanceId: string | null
    nextEntry: { userId: string; plan: string } | null
  }

  // End session in D1
  await endSession(env.DB, activeSession.id)
  await logUsage(env.DB, auth.userId, "session_end", activeSession.id)

  // Destroy the freed instance
  if (result.freedInstanceId) {
    await destroyInstance(result.freedInstanceId).catch(console.error)
  }

  // Assign next queued user if any
  if (result.nextEntry) {
    const { userId: nextUserId } = result.nextEntry
    try {
      const instance = await createInstance()

      await doFetch(stub, "/confirm", { userId: nextUserId, instance })

      const sessionId = crypto.randomUUID()
      await createSession(env.DB, {
        id: sessionId,
        user_id: nextUserId,
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
