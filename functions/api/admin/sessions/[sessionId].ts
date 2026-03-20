import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../../lib/env"
import { json, error } from "../../../lib/response"
import { requireAdmin } from "../../../lib/auth"
import { getSessionById, endSession, logUsage } from "../../../lib/db"
import { destroyInstance } from "../../../../workers/vast-service"

const DO_URL = "https://queue-manager.internal"

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const sessionId = params.sessionId as string

  const session = await getSessionById(env.DB, sessionId)
  if (!session) return error("Session not found", 404)

  // Always release the DO slot — idempotent, fixes desync where D1 is ended but DO still shows active
  const doId = env.QUEUE_MANAGER.idFromName("global")
  const stub = env.QUEUE_MANAGER.get(doId)
  await stub.fetch(`${DO_URL}/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: session.user_id }),
  })

  if (!session.ended_at) {
    // End session in D1 and log it
    await endSession(env.DB, sessionId)
    await logUsage(env.DB, session.user_id, "session_end_admin_kill", sessionId)

    // Destroy the GPU instance
    if (session.instance_id) {
      await destroyInstance(session.instance_id).catch(console.error)
    }
  }

  return json({ success: true })
}
