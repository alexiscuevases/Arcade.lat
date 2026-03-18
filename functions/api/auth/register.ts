import type { PagesFunction } from "@cloudflare/workers-types"
import type { Env } from "../../lib/env"
import { json, error } from "../../lib/response"
import { hashPassword } from "../../lib/crypto"
import { signToken } from "../../lib/jwt"
import { getUserByEmail, createUser } from "../../lib/db"

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ email: string; password: string }>()

  if (!body.email || !body.password) {
    return error("Email and password are required")
  }
  if (body.password.length < 8) {
    return error("Password must be at least 8 characters")
  }

  const existing = await getUserByEmail(env.DB, body.email)
  if (existing) return error("Email already registered", 409)

  const id = crypto.randomUUID()
  const password_hash = await hashPassword(body.password)

  await createUser(env.DB, { id, email: body.email, password_hash, plan: "FREE" })

  const token = await signToken(
    { userId: id, email: body.email, plan: "FREE" },
    env.JWT_SECRET
  )

  return json({ token, user: { id, email: body.email, plan: "FREE" } }, 201)
}
