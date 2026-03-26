import type { Env } from "./env"
import type { VastConfig } from "../../workers/vast-gpu-service"

export function getVastConfig(env: Env): VastConfig {
  return {
    apiKey: env.VAST_API_KEY,
    gpuName: env.VAST_GPU_NAME,
    image: env.VAST_IMAGE,
    diskGb: parseInt(env.VAST_DISK_GB, 10) || 20,
    sunshinePort: parseInt(env.VAST_SUNSHINE_PORT, 10) || 47989,
    onstart: env.VAST_ONSTART || "",
  }
}
