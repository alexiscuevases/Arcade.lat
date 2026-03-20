import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json } from "../../lib/response"
import { requireAuth } from "../../lib/auth"
import { getUserActivity } from "../../lib/db"

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const data = await getUserActivity(env.DB, auth.userId)
  return json(data)
}
