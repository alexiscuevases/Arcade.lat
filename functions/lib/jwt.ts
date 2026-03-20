import { SignJWT, jwtVerify } from "jose"
import type { JWTPayload } from "../../shared/types"

export type { JWTPayload }

function key(secret: string) {
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: JWTPayload, secret: string): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key(secret))
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, key(secret))
  return payload as unknown as JWTPayload
}
