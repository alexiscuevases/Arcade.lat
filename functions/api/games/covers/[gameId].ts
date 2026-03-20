import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../../lib/env"

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const gameId = params.gameId as string
  const obj = await env.GAME_COVERS.get(`covers/${gameId}`)

  if (!obj) return new Response("Not found", { status: 404 })

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
