// Mock Vast.ai service — replace with real Vast.ai API calls in production

export interface VastInstance {
  id: string
  ip: string
  port: number
  token: string
}

// In production: POST https://console.vast.ai/api/v0/asks/<id>/
export async function createInstance(): Promise<VastInstance> {
  await new Promise((r) => setTimeout(r, 500)) // simulate network latency

  return {
    id: `vast_${crypto.randomUUID().slice(0, 8)}`,
    ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    port: 47989 + Math.floor(Math.random() * 1000), // Sunshine default range
    token: crypto.randomUUID().replace(/-/g, ""),
  }
}

// In production: DELETE https://console.vast.ai/api/v0/instances/<id>/
export async function destroyInstance(instanceId: string): Promise<void> {
  console.log(`[vast] Destroying instance ${instanceId}`)
  await new Promise((r) => setTimeout(r, 200))
}
