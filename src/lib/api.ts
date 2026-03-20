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
      request<{ token: string; user: { id: string; email: string; plan: string; role: string } }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),

    login: (email: string, password: string) =>
      request<{ token: string; user: { id: string; email: string; plan: string; role: string } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),

    me: () =>
      request<{ id: string; email: string; plan: string }>("/api/auth/me"),
  },

  session: {
    start: (gameId: string) =>
      request<
        | { status: "active"; gameId: string; connection: { ip: string; port: number; token: string } }
        | { status: "queued"; gameId: string; position: number }
        | { status: "pending"; gameId: string }
      >("/api/session/start", { method: "POST", body: JSON.stringify({ gameId }) }),

    end: () =>
      request<{ success: boolean }>("/api/session/end", { method: "POST" }),

    status: () =>
      request<
        { dailyUsedSeconds: number; dailyLimitSeconds: number | null } & (
          | { status: "active"; gameId: string; connection: { ip: string; port: number; token: string }; startedAt: number }
          | { status: "queued"; gameId: string; position: number }
          | { status: "pending"; gameId: string }
          | { status: "idle" }
        )
      >("/api/session/status"),
  },

  stripe: {
    createCheckoutSession: (plan: "BASIC" | "PRO") =>
      request<{ url: string }>("/api/stripe/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
  },

  games: {
    list: () =>
      request<{
        games: Array<{
          id: string
          title: string
          genre: string
          players: string
          gradient: string
          developer: string
          description: string
          enabled: number
          created_at: string
        }>
      }>("/api/games"),

    get: (id: string) =>
      request<{
        game: {
          id: string
          title: string
          genre: string
          players: string
          gradient: string
          developer: string
          description: string
          enabled: number
          created_at: string
        }
      }>(`/api/games?id=${encodeURIComponent(id)}`),
  },

  admin: {
    stats: () =>
      request<{
        totalUsers: number
        planBreakdown: { FREE: number; BASIC: number; PRO: number }
        activeSessions: number
        recentUsers: Array<{
          id: string
          email: string
          plan: "FREE" | "BASIC" | "PRO"
          role: "ADMIN" | "USER"
          created_at: string
        }>
      }>("/api/admin/stats"),

    users: () =>
      request<{
        users: Array<{
          id: string
          email: string
          plan: "FREE" | "BASIC" | "PRO"
          role: "ADMIN" | "USER"
          created_at: string
        }>
        total: number
      }>("/api/admin/users"),

    updateUser: (id: string, patch: { plan?: string; role?: string }) =>
      request<{ success: boolean }>(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),

    sessions: () =>
      request<{
        sessions: Array<{
          id: string
          user_id: string
          user_email: string
          instance_ip: string | null
          instance_port: number | null
          started_at: string
        }>
      }>("/api/admin/sessions"),

    killSession: (id: string) =>
      request<{ success: boolean }>(`/api/admin/sessions/${id}`, { method: "DELETE" }),

    games: () =>
      request<{
        games: Array<{
          id: string
          title: string
          genre: string
          players: string
          gradient: string
          developer: string
          description: string
          enabled: number
          created_at: string
        }>
      }>("/api/admin/games"),

    updateGame: (id: string, patch: { enabled?: number; title?: string; genre?: string }) =>
      request<{ success: boolean }>(`/api/admin/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),

    deleteGame: (id: string) =>
      request<{ success: boolean }>(`/api/admin/games/${id}`, { method: "DELETE" }),

    seedGames: () =>
      request<{ seeded: number }>("/api/admin/games/seed", { method: "POST" }),
  },
}

export { ApiError }
