import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json } from "../../lib/response"
import { requireAuth } from "../../lib/auth"
import { getUserById } from "../../lib/db"

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const user = await getUserById(env.DB, auth.userId)
  if (!user) return json({ error: "User not found" }, 404)

  return json({ id: user.id, email: user.email, plan: user.plan, role: user.role ?? "USER" })
}
