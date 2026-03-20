import { verifyToken, type JWTPayload } from "./jwt"
import { error } from "./response"

function getBearer(request: Request): string | null {
  const header = request.headers.get("Authorization")
  if (!header?.startsWith("Bearer ")) return null
  return header.slice(7)
}

export async function getAuth(
  request: Request,
  secret: string
): Promise<JWTPayload | null> {
  const token = getBearer(request)
  if (!token) return null
  try {
    return await verifyToken(token, secret)
  } catch {
    return null
  }
}

export async function requireAuth(
  request: Request,
  secret: string
): Promise<JWTPayload | Response> {
  const auth = await getAuth(request, secret)
  if (!auth) return error("Unauthorized", 401)
  return auth
}

export async function requireAdmin(
  request: Request,
  secret: string
): Promise<JWTPayload | Response> {
  const auth = await getAuth(request, secret)
  if (!auth) return error("Unauthorized", 401)
  if (auth.role !== "ADMIN") return error("Forbidden", 403)
  return auth
}
