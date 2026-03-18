// D1 query helpers — no ORM, plain SQL

export interface User {
  id: string
  email: string
  password_hash: string
  plan: "FREE" | "BASIC" | "PRO"
  stripe_customer_id: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  plan: "BASIC" | "PRO"
  status: string
  current_period_end: number
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  instance_id: string | null
  instance_ip: string | null
  instance_port: number | null
  instance_token: string | null
  started_at: string
  ended_at: string | null
}

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
    "id" | "user_id" | "instance_id" | "instance_ip" | "instance_port" | "instance_token"
  >
) {
  return db
    .prepare(
      `INSERT INTO sessions (id, user_id, instance_id, instance_ip, instance_port, instance_token)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      session.id,
      session.user_id,
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
