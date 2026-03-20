// ─── Core domain types ───────────────────────────────────────────────────────

export type Plan = "FREE" | "BASIC" | "PRO"
export type PaidPlan = "BASIC" | "PRO"
export type Role = "ADMIN" | "USER"

// ─── Database row types ──────────────────────────────────────────────────────

export interface GameRow {
  id: string
  title: string
  genre: string
  players: string
  gradient: string
  developer: string
  description: string
  enabled: number // 1 = enabled, 0 = disabled
  cover_art_url: string | null
  created_at: string
}

export interface User {
  id: string
  email: string
  password_hash: string
  plan: Plan
  role: Role
  stripe_customer_id: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  plan: PaidPlan
  status: string
  current_period_end: number
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  game_id: string | null
  instance_id: string | null
  instance_ip: string | null
  instance_port: number | null
  instance_token: string | null
  started_at: string
  ended_at: string | null
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  plan: Plan
  role: Role
}

export interface JWTPayload {
  userId: string
  email: string
  plan: Plan
  role: Role
}

// ─── Admin views ─────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: string
  email: string
  plan: Plan
  role: Role
  created_at: string
}

export interface AdminSessionRow {
  id: string
  user_id: string
  user_email: string
  game_id: string | null
  game_title: string | null
  instance_ip: string | null
  instance_port: number | null
  started_at: string
}

export interface AdminStats {
  totalUsers: number
  planBreakdown: Record<Plan, number>
  activeSessions: number
  recentUsers: AdminUserRow[]
}

// ─── GPU instances ───────────────────────────────────────────────────────────

export interface InstanceInfo {
  id: string
  ip: string
  port: number
  token: string
}

export interface ConnectionInfo {
  ip: string
  port: number
  token: string
}

// ─── Queue / Durable Object types ────────────────────────────────────────────

export interface ActiveSession {
  userId: string
  gameId: string
  instance: InstanceInfo
  startedAt: number
}

export interface QueueEntry {
  userId: string
  gameId: string
  plan: Plan
  joinedAt: number
}

export type JoinResponse =
  | { type: "active"; session: ActiveSession }
  | { type: "pending" }
  | { type: "queued"; position: number }
  | { type: "ready" } // GPU slot reserved — caller must create instance and POST /confirm

export type ConfirmResponse = { type: "active"; session: ActiveSession }

export type ReleaseResponse = {
  freedInstanceId: string | null
  nextEntry: QueueEntry | null
}

export type SessionStatus =
  | { type: "active"; session: ActiveSession }
  | { type: "pending"; gameId: string }
  | { type: "queued"; position: number; gameId: string }
  | { type: "idle" }

// ─── API response types ─────────────────────────────────────────────────────

export type SessionStartResponse =
  | { status: "active"; gameId: string; connection: ConnectionInfo }
  | { status: "queued"; gameId: string; position: number }
  | { status: "pending"; gameId: string }

export type SessionStatusResponse =
  { dailyUsedSeconds: number; dailyLimitSeconds: number | null } & (
    | { status: "active"; gameId: string; connection: ConnectionInfo; startedAt: number }
    | { status: "queued"; gameId: string; position: number }
    | { status: "pending"; gameId: string }
    | { status: "idle" }
    | { status: "limit_reached" }
  )
