import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../../lib/env"
import { json, error } from "../../../lib/response"
import { getStub } from "../../../lib/do"
import { DO_URL } from "../../../../shared/settings"

/** POST /api/admin/sessions/reset-queue — wipe all DO state (pending slots, queue, active sessions) */
export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const stub = getStub(env)

  const res = await stub.fetch(`${DO_URL}/reset`, { method: "POST" })
  if (!res.ok) return error("Failed to reset queue", 500)

  const result = await res.json()
  return json(result)
}
