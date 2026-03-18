import { getToken } from "./auth"

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  }

  const res = await fetch(path, { ...init, headers })

  if (!res.ok) {
    const body = await res.json<{ error?: string }>().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? "Request failed")
  }

  return res.json<T>()
}

// Auth
export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ token: string; user: { id: string; email: string; plan: string } }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),

    login: (email: string, password: string) =>
      request<{ token: string; user: { id: string; email: string; plan: string } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),

    me: () =>
      request<{ id: string; email: string; plan: string }>("/api/auth/me"),
  },

  session: {
    start: () =>
      request<
        | { status: "active"; connection: { ip: string; port: number; token: string } }
        | { status: "queued"; position: number }
        | { status: "pending" }
      >("/api/session/start", { method: "POST" }),

    end: () =>
      request<{ success: boolean }>("/api/session/end", { method: "POST" }),

    status: () =>
      request<
        | { status: "active"; connection: { ip: string; port: number; token: string }; startedAt: number }
        | { status: "queued"; position: number }
        | { status: "pending" }
        | { status: "idle" }
      >("/api/session/status"),
  },

  stripe: {
    createCheckoutSession: (plan: "BASIC" | "PRO") =>
      request<{ url: string }>("/api/stripe/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
  },
}

export { ApiError }
