import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json } from "../../lib/response"
import { requireAdmin } from "../../lib/auth"
import { getAdminStats } from "../../lib/db"

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const stats = await getAdminStats(env.DB)
  return json(stats)
}
