import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../../lib/env"
import { json, error } from "../../../lib/response"
import { requireAdmin } from "../../../lib/auth"
import { updateUserPlan, updateUserRole } from "../../../lib/db"

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const userId = params.userId as string
  const body = await request.json<{ plan?: string; role?: string }>()

  if (body.plan) {
    if (!["FREE", "BASIC", "PRO"].includes(body.plan)) {
      return error("Invalid plan")
    }
    await updateUserPlan(env.DB, userId, body.plan)
  }

  if (body.role) {
    if (!["ADMIN", "USER"].includes(body.role)) {
      return error("Invalid role")
    }
    await updateUserRole(env.DB, userId, body.role)
  }

  return json({ success: true })
}
