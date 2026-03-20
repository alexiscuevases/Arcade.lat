import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../../lib/env"
import { json, error } from "../../../lib/response"
import { requireAdmin } from "../../../lib/auth"
import { getSessionById, endSession, logUsage } from "../../../lib/db"
import { destroyInstance } from "../../../../workers/gcp-gpu-service"
import { getGCPConfig } from "../../../lib/gcp"
import { getStub, doFetch } from "../../../lib/do"

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const sessionId = params.sessionId as string

  const session = await getSessionById(env.DB, sessionId)
  if (!session) return error("Session not found", 404)

  // Always release the DO slot — idempotent, fixes desync where D1 is ended but DO still shows active
  const stub = getStub(env)
  await doFetch(stub, "/release", { userId: session.user_id })

  if (!session.ended_at) {
    // End session in D1 and log it
    await endSession(env.DB, sessionId)
    await logUsage(env.DB, session.user_id, "session_end_admin_kill", sessionId)

    // Destroy the GPU instance
    if (session.instance_id) {
      await destroyInstance(getGCPConfig(env), session.instance_id).catch(console.error)
    }
  }

  return json({ success: true })
}
