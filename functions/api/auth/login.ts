import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json, error } from "../../lib/response"
import { verifyPassword } from "../../lib/crypto"
import { signToken } from "../../lib/jwt"
import { getUserByEmail } from "../../lib/db"

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ email: string; password: string }>()

  if (!body.email || !body.password) {
    return error("Email and password are required")
  }

  const user = await getUserByEmail(env.DB, body.email)
  if (!user) return error("Invalid credentials", 401)

  const valid = await verifyPassword(body.password, user.password_hash)
  if (!valid) return error("Invalid credentials", 401)

  const token = await signToken(
    { userId: user.id, email: user.email, plan: user.plan },
    env.JWT_SECRET
  )

  return json({ token, user: { id: user.id, email: user.email, plan: user.plan } })
}
