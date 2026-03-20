// D1 query helpers — no ORM, plain SQL

import type {
  GameRow,
  User,
  Subscription,
  Session,
  AdminUserRow,
  AdminSessionRow,
  ActivitySession,
  ActivityStats,
} from "../../shared/types"
import { DAILY_LIMIT_SECONDS } from "../../shared/settings"

export type { GameRow, User, Subscription, Session, AdminUserRow, AdminSessionRow, ActivitySession, ActivityStats }
export { DAILY_LIMIT_SECONDS }

// --- Users ---

export function getUserByEmail(db: D1Database, email: string) {
  return db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<User>()
}

export function getUserById(db: D1Database, id: string) {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>()
}

export function createUser(
  db: D1Database,
  user: Pick<User, "id" | "email" | "password_hash" | "plan">
) {
  return db
    .prepare(
      "INSERT INTO users (id, email, password_hash, plan) VALUES (?, ?, ?, ?)"
    )
    .bind(user.id, user.email, user.password_hash, user.plan)
    .run()
}

export function updateUserPlan(db: D1Database, userId: string, plan: string) {
  return db.prepare("UPDATE users SET plan = ? WHERE id = ?").bind(plan, userId).run()
}

export function updateUserRole(db: D1Database, userId: string, role: string) {
  return db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, userId).run()
}

// --- Admin queries ---

export async function getAllUsers(db: D1Database): Promise<AdminUserRow[]> {
  const result = await db
    .prepare(
      "SELECT id, email, plan, role, created_at FROM users ORDER BY created_at DESC"
    )
    .all<AdminUserRow>()
  return result.results
}

export async function getAllActiveSessions(db: D1Database): Promise<AdminSessionRow[]> {
  const result = await db
    .prepare(
      `SELECT s.id, s.user_id, u.email AS user_email,
              s.game_id, g.title AS game_title,
              s.instance_ip, s.instance_port, s.started_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN games g ON g.id = s.game_id
       WHERE s.ended_at IS NULL
       ORDER BY s.started_at DESC`
    )
    .all<AdminSessionRow>()
  return result.results
}

export async function getAdminStats(db: D1Database) {
  const [counts, sessionCount, recent] = await Promise.all([
    db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN plan = 'FREE'  THEN 1 ELSE 0 END) AS free_count,
          SUM(CASE WHEN plan = 'BASIC' THEN 1 ELSE 0 END) AS basic_count,
          SUM(CASE WHEN plan = 'PRO'   THEN 1 ELSE 0 END) AS pro_count
         FROM users`
      )
      .first<{ total: number; free_count: number; basic_count: number; pro_count: number }>(),
    db
      .prepare("SELECT COUNT(*) AS cnt FROM sessions WHERE ended_at IS NULL")
      .first<{ cnt: number }>(),
    db
      .prepare(
        "SELECT id, email, plan, role, created_at FROM users ORDER BY created_at DESC LIMIT 10"
      )
      .all<AdminUserRow>(),
  ])

  return {
    totalUsers: counts?.total ?? 0,
    planBreakdown: {
      FREE: counts?.free_count ?? 0,
      BASIC: counts?.basic_count ?? 0,
      PRO: counts?.pro_count ?? 0,
    },
    activeSessions: sessionCount?.cnt ?? 0,
    recentUsers: recent.results,
  }
}

export function updateUserStripeCustomer(
  db: D1Database,
  userId: string,
  customerId: string
) {
  return db
    .prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
    .bind(customerId, userId)
    .run()
}

// --- Subscriptions ---

export function upsertSubscription(
  db: D1Database,
  sub: Omit<Subscription, "created_at">
) {
  return db
    .prepare(
      `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, plan, status, current_period_end)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(stripe_subscription_id) DO UPDATE SET
         plan = excluded.plan,
         status = excluded.status,
         current_period_end = excluded.current_period_end`
    )
    .bind(
      sub.id,
      sub.user_id,
      sub.stripe_subscription_id,
      sub.plan,
      sub.status,
      sub.current_period_end
    )
    .run()
}

export function getActiveSubscription(db: D1Database, userId: string) {
  return db
    .prepare(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
    )
    .bind(userId)
    .first<Subscription>()
}

// --- Sessions ---

export function createSession(
  db: D1Database,
  session: Pick<
    Session,
    "id" | "user_id" | "game_id" | "instance_id" | "instance_ip" | "instance_port" | "instance_token"
  >
) {
  return db
    .prepare(
      `INSERT INTO sessions (id, user_id, game_id, instance_id, instance_ip, instance_port, instance_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      session.id,
      session.user_id,
      session.game_id,
      session.instance_id,
      session.instance_ip,
      session.instance_port,
      session.instance_token
    )
    .run()
}

export function endSession(db: D1Database, sessionId: string) {
  return db
    .prepare("UPDATE sessions SET ended_at = datetime('now') WHERE id = ?")
    .bind(sessionId)
    .run()
}

export function getActiveSession(db: D1Database, userId: string) {
  return db
    .prepare("SELECT * FROM sessions WHERE user_id = ? AND ended_at IS NULL LIMIT 1")
    .bind(userId)
    .first<Session>()
}

export function getSessionById(db: D1Database, sessionId: string) {
  return db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .bind(sessionId)
    .first<Session>()
}

// --- Games ---

export async function getAllGames(db: D1Database): Promise<GameRow[]> {
  const result = await db
    .prepare("SELECT * FROM games ORDER BY created_at ASC")
    .all<GameRow>()
  return result.results
}

export async function getEnabledGames(db: D1Database): Promise<GameRow[]> {
  const result = await db
    .prepare("SELECT * FROM games WHERE enabled = 1 ORDER BY created_at ASC")
    .all<GameRow>()
  return result.results
}

export function getGameById(db: D1Database, id: string) {
  return db.prepare("SELECT * FROM games WHERE id = ?").bind(id).first<GameRow>()
}

export function upsertGame(
  db: D1Database,
  game: Omit<GameRow, "enabled" | "cover_art_url" | "created_at"> & { enabled?: number; cover_art_url?: string | null }
) {
  return db
    .prepare(
      `INSERT INTO games (id, title, genre, players, gradient, developer, description, enabled, cover_art_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         genre = excluded.genre,
         players = excluded.players,
         gradient = excluded.gradient,
         developer = excluded.developer,
         description = excluded.description`
    )
    .bind(
      game.id,
      game.title,
      game.genre,
      game.players,
      game.gradient,
      game.developer,
      game.description,
      game.enabled ?? 1,
      game.cover_art_url ?? null
    )
    .run()
}

export function updateGame(
  db: D1Database,
  id: string,
  patch: Partial<Pick<GameRow, "title" | "genre" | "players" | "gradient" | "developer" | "description" | "enabled" | "cover_art_url">>
) {
  const fields = Object.keys(patch) as (keyof typeof patch)[]
  const setClauses = fields.map((f) => `${f} = ?`).join(", ")
  const values = fields.map((f) => patch[f])
  return db
    .prepare(`UPDATE games SET ${setClauses} WHERE id = ?`)
    .bind(...values, id)
    .run()
}

export function deleteGame(db: D1Database, id: string) {
  return db.prepare("DELETE FROM games WHERE id = ?").bind(id).run()
}

// --- Daily Usage ---

/**
 * Returns the total seconds a user has played today (UTC day).
 * Ongoing sessions (ended_at IS NULL) count up to now.
 */
export async function getDailyUsageSeconds(db: D1Database, userId: string): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COALESCE(SUM(
         CAST((JULIANDAY(COALESCE(ended_at, datetime('now'))) - JULIANDAY(started_at)) * 86400 AS INTEGER)
       ), 0) AS used_seconds
       FROM sessions
       WHERE user_id = ?
         AND date(started_at) = date('now')`
    )
    .bind(userId)
    .first<{ used_seconds: number }>()
  return result?.used_seconds ?? 0
}

// --- Usage Logs ---

export function logUsage(
  db: D1Database,
  userId: string,
  action: string,
  sessionId?: string
) {
  return db
    .prepare(
      "INSERT INTO usage_logs (id, user_id, session_id, action) VALUES (?, ?, ?, ?)"
    )
    .bind(crypto.randomUUID(), userId, sessionId ?? null, action)
    .run()
}

// --- Activity / Session History ---

export async function getUserActivity(
  db: D1Database,
  userId: string
): Promise<{ sessions: ActivitySession[]; stats: ActivityStats }> {
  const result = await db
    .prepare(
      `SELECT
         s.id,
         s.game_id,
         g.title   AS game_title,
         g.genre   AS game_genre,
         g.gradient AS game_gradient,
         g.cover_art_url AS game_cover_art_url,
         s.started_at,
         s.ended_at,
         CAST(
           (JULIANDAY(COALESCE(s.ended_at, datetime('now'))) - JULIANDAY(s.started_at)) * 86400
         AS INTEGER) AS duration_seconds
       FROM sessions s
       LEFT JOIN games g ON g.id = s.game_id
       WHERE s.user_id = ?
       ORDER BY s.started_at DESC
       LIMIT 100`
    )
    .bind(userId)
    .all<ActivitySession>()

  const sessions = result.results

  // Compute stats
  const totalSessions = sessions.length
  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0)
  const gameSet = new Set(sessions.map((s) => s.game_title).filter(Boolean))
  const uniqueGames = gameSet.size

  const gameTime: Record<string, number> = {}
  for (const s of sessions) {
    if (s.game_title) {
      gameTime[s.game_title] = (gameTime[s.game_title] ?? 0) + s.duration_seconds
    }
  }
  const sorted = Object.entries(gameTime).sort(([, a], [, b]) => b - a)

  return {
    sessions,
    stats: {
      total_sessions: totalSessions,
      total_seconds: totalSeconds,
      unique_games: uniqueGames,
      most_played_game: sorted[0]?.[0] ?? null,
      most_played_seconds: sorted[0]?.[1] ?? 0,
    },
  }
}
