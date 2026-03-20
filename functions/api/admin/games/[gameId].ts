import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../../lib/env"
import { json, error } from "../../../lib/response"
import { requireAdmin } from "../../../lib/auth"
import { updateGame, deleteGame } from "../../../lib/db"

interface GamePatch {
  title?: string
  genre?: string
  players?: string
  gradient?: string
  developer?: string
  description?: string
  enabled?: number
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const gameId = params.gameId as string
  const patch = await request.json<GamePatch>()

  const allowed: (keyof GamePatch)[] = [
    "title", "genre", "players", "gradient", "developer", "description", "enabled",
  ]
  const clean: GamePatch = {}
  for (const key of allowed) {
    if (key in patch) (clean as Record<string, unknown>)[key] = patch[key]
  }

  if (Object.keys(clean).length === 0) {
    return error("No valid fields to update", 400)
  }

  await updateGame(env.DB, gameId, clean)
  return json({ success: true })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const gameId = params.gameId as string
  await deleteGame(env.DB, gameId)
  return json({ success: true })
}
