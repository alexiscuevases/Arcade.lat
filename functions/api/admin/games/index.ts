import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../../lib/env"
import { json, error } from "../../../lib/response"
import { requireAdmin } from "../../../lib/auth"
import { getAllGames, upsertGame } from "../../../lib/db"

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const games = await getAllGames(env.DB)
  return json({ games })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const body = await request.json<{
    id: string
    title: string
    genre: string
    players: string
    gradient: string
    developer: string
    description: string
    enabled?: number
  }>()

  if (!body.id || !body.title || !body.genre || !body.developer) {
    return error("id, title, genre, and developer are required", 400)
  }

  await upsertGame(env.DB, body)
  return json({ success: true })
}
