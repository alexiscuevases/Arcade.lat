// ─── Daily usage limits (seconds per plan) ──────────────────────────────────

export const DAILY_LIMIT_SECONDS: Record<string, number | null> = {
  FREE: 3600,      // 1 hour
  BASIC: 36000,    // 10 hours
  PRO: null,       // unlimited
}

// ─── Durable Object internal URL ─────────────────────────────────────────────

export const DO_URL = "https://queue-manager.internal"
