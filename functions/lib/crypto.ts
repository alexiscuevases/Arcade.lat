// Password hashing via Web Crypto API (PBKDF2) — works in Cloudflare Workers

const ITERATIONS = 100_000
const KEY_LEN = 32
const DIGEST = "SHA-256"

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: DIGEST },
    keyMaterial,
    KEY_LEN * 8
  )
  const hash = new Uint8Array(bits)
  const combined = new Uint8Array(salt.length + hash.length)
  combined.set(salt)
  combined.set(hash, salt.length)
  return btoa(String.fromCharCode(...combined))
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const expectedHash = combined.slice(16)

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: DIGEST },
    keyMaterial,
    KEY_LEN * 8
  )
  const actualHash = new Uint8Array(bits)

  if (actualHash.length !== expectedHash.length) return false
  // Constant-time comparison
  let diff = 0
  for (let i = 0; i < actualHash.length; i++) {
    diff |= actualHash[i] ^ expectedHash[i]
  }
  return diff === 0
}
