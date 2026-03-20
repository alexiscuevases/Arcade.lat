import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json } from "../../lib/response"
import { getEnabledGames, getGameById } from "../../lib/db"

// GET /api/games — list enabled games (public)
// GET /api/games?id=xxx — get single game by id (public)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (id) {
    const game = await getGameById(env.DB, id)
    if (!game) return json({ error: "Game not found" }, 404)
    return json({ game })
  }

  const games = await getEnabledGames(env.DB)
  return json({ games })
}
