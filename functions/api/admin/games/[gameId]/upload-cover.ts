import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../../../lib/env"
import { json, error } from "../../../../lib/response"
import { requireAdmin } from "../../../../lib/auth"
import { updateGame } from "../../../../lib/db"

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const gameId = params.gameId as string

  const formData = await request.formData()
  const file = formData.get("cover") as File | null

  if (!file) return error("cover file is required", 400)
  if (!file.type.startsWith("image/")) return error("file must be an image", 400)

  const key = `covers/${gameId}`
  await env.GAME_COVERS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  const coverUrl = `/api/games/covers/${gameId}`
  await updateGame(env.DB, gameId, { cover_art_url: coverUrl })

  return json({ success: true, url: coverUrl })
}
