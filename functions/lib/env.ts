export interface Env {
  DB: D1Database
  QUEUE_MANAGER: DurableObjectNamespace
  JWT_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRICE_BASIC: string
  STRIPE_PRICE_PRO: string
  APP_URL: string
}
