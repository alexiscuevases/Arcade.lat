// Vast.ai GPU service — search offers, create/destroy instances
// Designed for Cloudflare Workers (raw fetch, no SDK)

import type { InstanceInfo } from "../shared/types"

export type { InstanceInfo }

export interface VastConfig {
  apiKey: string
  gpuName: string          // e.g. "RTX_4090"
  image: string            // Docker image URI
  diskGb: number           // disk space in GB
  sunshinePort: number     // internal Sunshine port (e.g. 47989)
  onstart: string          // shell commands to run on startup
}

const VAST_BASE = "https://cloud.vast.ai/api/v0"

// ─── Headers helper ─────────────────────────────────────────────────────────

function headers(apiKey: string, json = false): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${apiKey}` }
  if (json) h["Content-Type"] = "application/json"
  return h
}

// ─── Search for available GPU offer ─────────────────────────────────────────

interface VastOffer {
  id: number
  gpu_name: string
  num_gpus: number
  gpu_ram: number
  dph_total: number
  inet_down: number
  inet_up: number
  reliability: number
  rentable: boolean
  verified: boolean
}

async function findBestOffer(cfg: VastConfig): Promise<VastOffer> {
  const res = await fetch(`${VAST_BASE}/bundles/`, {
    method: "POST",
    headers: headers(cfg.apiKey, true),
    body: JSON.stringify({
      gpu_name: { eq: cfg.gpuName },
      num_gpus: { eq: 1 },
      rentable: { eq: true },
      verified: { eq: true },
      order: [["dph_total", "asc"]],
      type: "ondemand",
      limit: 1,
      allocated_storage: cfg.diskGb,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vast.ai search failed (${res.status}): ${err}`)
  }

  const data = await res.json() as { offers?: VastOffer[] }
  if (!data.offers?.length) {
    throw new Error(`No hay GPUs disponibles (${cfg.gpuName}) en Vast.ai`)
  }

  return data.offers[0]
}

// ─── Create instance from offer ─────────────────────────────────────────────

interface CreateResponse {
  success: boolean
  new_contract: number
}

async function rentInstance(cfg: VastConfig, offerId: number, sunshineToken: string): Promise<number> {
  const res = await fetch(`${VAST_BASE}/asks/${offerId}/`, {
    method: "PUT",
    headers: headers(cfg.apiKey, true),
    body: JSON.stringify({
      image: cfg.image,
      disk: cfg.diskGb,
      runtype: "args",
      env: {
        SUNSHINE_TOKEN: sunshineToken,
        [`-p ${cfg.sunshinePort}:${cfg.sunshinePort}`]: "1",
      },
      onstart: cfg.onstart,
      cancel_unavail: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vast.ai create instance failed (${res.status}): ${err}`)
  }

  const data = await res.json() as CreateResponse
  if (!data.success || !data.new_contract) {
    throw new Error("Vast.ai create returned unexpected response")
  }

  return data.new_contract
}

// ─── Poll instance until running + get connection info ──────────────────────

interface VastInstance {
  id: number
  actual_status: string
  intended_status: string
  public_ipaddr: string | null
  ports: Record<string, { HostPort: string }[]> | null
  status_msg: string | null
}

async function waitForInstance(
  apiKey: string,
  instanceId: number,
  sunshinePort: number,
  maxWaitMs = 180_000,
): Promise<{ ip: string; port: number }> {
  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    const res = await fetch(`${VAST_BASE}/instances/${instanceId}/`, {
      headers: headers(apiKey),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Vast.ai get instance failed (${res.status}): ${err}`)
    }

    const inst = await res.json() as VastInstance

    if (inst.actual_status === "running" && inst.public_ipaddr && inst.ports) {
      const portKey = `${sunshinePort}/tcp`
      const mapped = inst.ports[portKey]
      if (mapped?.[0]?.HostPort) {
        return {
          ip: inst.public_ipaddr,
          port: parseInt(mapped[0].HostPort, 10),
        }
      }
    }

    // Instance failed
    if (inst.actual_status === "exited" || inst.intended_status === "stopped") {
      throw new Error(`Vast.ai instance failed to start: ${inst.status_msg ?? inst.actual_status}`)
    }

    await new Promise((r) => setTimeout(r, 5000))
  }

  throw new Error("Vast.ai instance timed out waiting to become ready")
}

// ─── Public API: createInstance ─────────────────────────────────────────────

export async function createInstance(cfg: VastConfig): Promise<InstanceInfo> {
  // 1. Find cheapest available GPU
  const offer = await findBestOffer(cfg)

  // 2. Generate session token
  const sunshineToken = crypto.randomUUID().replace(/-/g, "")

  // 3. Rent the instance
  const instanceId = await rentInstance(cfg, offer.id, sunshineToken)

  // 4. Wait for it to be running and get connection info
  const conn = await waitForInstance(cfg.apiKey, instanceId, cfg.sunshinePort)

  return {
    id: String(instanceId),
    ip: conn.ip,
    port: conn.port,
    token: sunshineToken,
  }
}

// ─── Public API: destroyInstance ────────────────────────────────────────────

export async function destroyInstance(cfg: VastConfig, instanceId: string): Promise<void> {
  const res = await fetch(`${VAST_BASE}/instances/${instanceId}/`, {
    method: "DELETE",
    headers: headers(cfg.apiKey),
  })

  // 404 = already gone, that's fine
  if (!res.ok && res.status !== 404) {
    const err = await res.text()
    throw new Error(`Vast.ai destroy failed (${res.status}): ${err}`)
  }

  console.log(`[vast] Destroyed instance ${instanceId}`)
}
