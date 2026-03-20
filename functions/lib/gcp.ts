import type { Env } from "./env"
import type { GCPConfig } from "../../workers/gcp-gpu-service"

export function getGCPConfig(env: Env): GCPConfig {
  return {
    projectId: env.GCP_PROJECT_ID,
    zone: env.GCP_ZONE,
    serviceAccountKey: env.GCP_SERVICE_ACCOUNT_KEY,
    instanceTag: env.GCP_INSTANCE_TAG,
    sunshinePort: parseInt(env.GCP_SUNSHINE_PORT, 10) || 47989,
  }
}
