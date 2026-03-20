export interface Env {
  DB: D1Database
  QUEUE_MANAGER: DurableObjectNamespace
  GAME_COVERS: R2Bucket
  JWT_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRICE_BASIC: string
  STRIPE_PRICE_PRO: string
  APP_URL: string
  // GCP — VMs pre-creadas desde el dashboard, aquí solo start/stop
  GCP_PROJECT_ID: string
  GCP_ZONE: string
  GCP_SERVICE_ACCOUNT_KEY: string // base64-encoded JSON key de service account
  GCP_INSTANCE_TAG: string        // tag de las VMs en GCP (e.g. "arcade-vm")
  GCP_SUNSHINE_PORT: string       // puerto de Sunshine en las VMs (e.g. "47989")
}
