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
  // Vast.ai — GPU instances on-demand
  VAST_API_KEY: string
  VAST_GPU_NAME: string          // e.g. "RTX_4090"
  VAST_IMAGE: string             // Docker image URI for the VM
  VAST_DISK_GB: string           // disk space in GB (e.g. "20")
  VAST_SUNSHINE_PORT: string     // internal Sunshine port (e.g. "47989")
  VAST_ONSTART: string           // shell commands to run on startup
}
