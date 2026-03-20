// GCP Compute Engine service — start/stop pre-created VMs with Sunshine
// VMs se crean manualmente desde el dashboard de GCP, aquí solo se inician y detienen
// Designed for Cloudflare Workers (raw fetch + JWT auth, sin SDK)

import type { InstanceInfo } from "../shared/types"

export type { InstanceInfo }

export interface GCPConfig {
  projectId: string
  zone: string
  serviceAccountKey: string // base64-encoded JSON key
  instanceTag: string       // tag para identificar VMs de arcade (e.g. "arcade-vm")
  sunshinePort: number      // puerto fijo de Sunshine en las VMs (e.g. 47989)
}

// ─── OAuth2 token from service account ──────────────────────────────────────

interface ServiceAccountKey {
  client_email: string
  private_key: string
}

function base64url(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function getAccessToken(serviceAccountKeyB64: string): Promise<string> {
  const keyJson = JSON.parse(atob(serviceAccountKeyB64)) as ServiceAccountKey
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })).buffer as ArrayBuffer)
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    iss: keyJson.client_email,
    scope: "https://www.googleapis.com/auth/compute",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).buffer as ArrayBuffer)

  const pemBody = keyJson.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "")
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(`${header}.${payload}`),
  )

  const jwt = `${header}.${payload}.${base64url(signature)}`

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    throw new Error(`GCP auth failed (${tokenRes.status}): ${body}`)
  }

  const { access_token } = await tokenRes.json() as { access_token: string }
  return access_token
}

// ─── Compute Engine helpers ─────────────────────────────────────────────────

const COMPUTE_BASE = "https://compute.googleapis.com/compute/v1"

function instanceUrl(cfg: GCPConfig, name: string) {
  return `${COMPUTE_BASE}/projects/${cfg.projectId}/zones/${cfg.zone}/instances/${name}`
}

// ─── Tipos de respuesta de GCP ──────────────────────────────────────────────

interface GCPInstance {
  name: string
  status: string // RUNNING, STAGING, STOPPED, TERMINATED, etc.
  networkInterfaces?: { accessConfigs?: { natIP?: string }[] }[]
  metadata?: { items?: { key: string; value: string }[] }
}

interface GCPInstanceList {
  items?: GCPInstance[]
}

interface GCPOperation {
  name: string
  selfLink: string
  status: string
  error?: { errors: { code: string; message: string }[] }
}

// ─── Iniciar una VM disponible (STOPPED/TERMINATED) ─────────────────────────

export async function createInstance(cfg: GCPConfig): Promise<InstanceInfo> {
  const accessToken = await getAccessToken(cfg.serviceAccountKey)

  // 1. Buscar una VM apagada con el tag correcto
  const vm = await findStoppedInstance(accessToken, cfg)
  if (!vm) {
    throw new Error("No hay VMs disponibles — todas están en uso o no existen VMs con el tag: " + cfg.instanceTag)
  }

  // 2. Generar token para esta sesión y setearlo como metadata
  const sunshineToken = crypto.randomUUID().replace(/-/g, "")
  await setInstanceMetadata(accessToken, cfg, vm, sunshineToken)

  // 3. Iniciar la VM
  const startRes = await fetch(`${instanceUrl(cfg, vm.name)}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!startRes.ok) {
    const err = await startRes.text()
    throw new Error(`GCP start failed (${startRes.status}): ${err}`)
  }

  const operation = await startRes.json() as GCPOperation
  await waitForOperation(accessToken, operation.selfLink)

  // 4. Esperar a que tenga IP externa
  const ip = await waitForExternalIp(accessToken, cfg, vm.name)

  return {
    id: vm.name,
    ip,
    port: cfg.sunshinePort,
    token: sunshineToken,
  }
}

// ─── Detener una VM (no la elimina, queda lista para reusar) ────────────────

export async function destroyInstance(cfg: GCPConfig, instanceId: string): Promise<void> {
  const accessToken = await getAccessToken(cfg.serviceAccountKey)

  const res = await fetch(`${instanceUrl(cfg, instanceId)}/stop`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok && res.status !== 404) {
    const err = await res.text()
    throw new Error(`GCP stop failed (${res.status}): ${err}`)
  }

  console.log(`[gcp] Stopped instance ${instanceId}`)
}

// ─── Buscar una VM apagada con el tag de arcade ─────────────────────────────

async function findStoppedInstance(accessToken: string, cfg: GCPConfig): Promise<GCPInstance | null> {
  const filter = encodeURIComponent(`status=TERMINATED OR status=STOPPED`)
  const url = `${COMPUTE_BASE}/projects/${cfg.projectId}/zones/${cfg.zone}/instances?filter=${filter}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`GCP list instances failed (${res.status})`)
  }

  const data = await res.json() as GCPInstanceList
  if (!data.items?.length) return null

  // Filtrar por tag
  const available = data.items.filter((vm) => {
    const tags = (vm as unknown as { tags?: { items?: string[] } }).tags?.items ?? []
    return tags.includes(cfg.instanceTag)
  })

  return available[0] ?? null
}

// ─── Setear metadata (token de Sunshine) antes de iniciar ───────────────────

async function setInstanceMetadata(
  accessToken: string,
  cfg: GCPConfig,
  vm: GCPInstance,
  sunshineToken: string,
): Promise<void> {
  // Necesitamos el fingerprint actual para actualizar metadata
  const getRes = await fetch(instanceUrl(cfg, vm.name), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!getRes.ok) {
    throw new Error(`GCP get instance failed (${getRes.status})`)
  }

  const current = await getRes.json() as {
    metadata?: { fingerprint?: string; items?: { key: string; value: string }[] }
  }

  const existingItems = (current.metadata?.items ?? []).filter(
    (item) => item.key !== "sunshine-token",
  )

  const res = await fetch(`${instanceUrl(cfg, vm.name)}/setMetadata`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fingerprint: current.metadata?.fingerprint,
      items: [
        ...existingItems,
        { key: "sunshine-token", value: sunshineToken },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GCP setMetadata failed (${res.status}): ${err}`)
  }

  const operation = await res.json() as GCPOperation
  await waitForOperation(accessToken, operation.selfLink)
}

// ─── Esperar a que la operación termine ─────────────────────────────────────

async function waitForOperation(accessToken: string, operationUrl: string, maxWaitMs = 120_000): Promise<void> {
  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    const res = await fetch(operationUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      throw new Error(`GCP operation poll failed (${res.status})`)
    }

    const op = await res.json() as GCPOperation

    if (op.status === "DONE") {
      if (op.error) {
        throw new Error(`GCP operation error: ${op.error.errors.map((e) => e.message).join(", ")}`)
      }
      return
    }

    await new Promise((r) => setTimeout(r, 3000))
  }

  throw new Error("GCP operation timed out")
}

// ─── Esperar IP externa ─────────────────────────────────────────────────────

async function waitForExternalIp(
  accessToken: string,
  cfg: GCPConfig,
  instanceName: string,
  maxWaitMs = 60_000,
): Promise<string> {
  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    const res = await fetch(instanceUrl(cfg, instanceName), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      throw new Error(`GCP get instance failed (${res.status})`)
    }

    const instance = await res.json() as GCPInstance

    const ip = instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP
    if (ip) return ip

    await new Promise((r) => setTimeout(r, 2000))
  }

  throw new Error("Timed out waiting for instance external IP")
}
