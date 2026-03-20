import { getToken } from "./auth"
import type {
  GameRow,
  AdminUserRow,
  AdminSessionRow,
  AdminStats,
  PaidPlan,
  SessionStartResponse,
  SessionStatusResponse,
  ActivityResponse,
} from "@shared/types"

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
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
      request<SessionStartResponse>("/api/session/start", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      }),

    end: () =>
      request<{ success: boolean }>("/api/session/end", { method: "POST" }),

    status: () =>
      request<SessionStatusResponse>("/api/session/status"),
  },

  stripe: {
    createCheckoutSession: (plan: PaidPlan) =>
      request<{ url: string }>("/api/stripe/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
  },

  activity: {
    list: () =>
      request<ActivityResponse>("/api/activity"),
  },

  games: {
    list: () =>
      request<{ games: GameRow[] }>("/api/games"),

    get: (id: string) =>
      request<{ game: GameRow }>(`/api/games?id=${encodeURIComponent(id)}`),
  },

  admin: {
    stats: () =>
      request<AdminStats>("/api/admin/stats"),

    users: () =>
      request<{ users: AdminUserRow[]; total: number }>("/api/admin/users"),

    updateUser: (id: string, patch: { plan?: string; role?: string }) =>
      request<{ success: boolean }>(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),

    sessions: () =>
      request<{ sessions: AdminSessionRow[] }>("/api/admin/sessions"),

    killSession: (id: string) =>
      request<{ success: boolean }>(`/api/admin/sessions/${id}`, { method: "DELETE" }),

    games: () =>
      request<{ games: GameRow[] }>("/api/admin/games"),

    updateGame: (
      id: string,
      patch: {
        enabled?: number
        title?: string
        genre?: string
        players?: string
        gradient?: string
        developer?: string
        description?: string
        cover_art_url?: string | null
      }
    ) =>
      request<{ success: boolean }>(`/api/admin/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),

    deleteGame: (id: string) =>
      request<{ success: boolean }>(`/api/admin/games/${id}`, { method: "DELETE" }),

    seedGames: () =>
      request<{ seeded: number }>("/api/admin/games/seed", { method: "POST" }),

    uploadGameCover: (id: string, file: File) => {
      const formData = new FormData()
      formData.append("cover", file)
      const token = getToken()
      return fetch(`/api/admin/games/${id}/upload-cover`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }).then((res) => {
        if (!res.ok) throw new Error("Upload failed")
        return res.json() as Promise<{ success: boolean; url: string }>
      })
    },
  },
}

export { ApiError }
