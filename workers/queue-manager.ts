// Durable Object — single-threaded priority queue + GPU session manager

import type {
  InstanceInfo,
  ActiveSession,
  QueueEntry,
  JoinResponse,
  ConfirmResponse,
  ReleaseResponse,
  SessionStatus,
  Plan,
} from "../shared/types"

// DO message types
type JoinRequest = { userId: string; gameId: string; plan: Plan }
type ConfirmRequest = { userId: string; gameId: string; instance: InstanceInfo }
type ReleaseRequest = { userId: string }

// Pending slots older than this are considered stale (e.g. worker timed out before /confirm or /release)
const PENDING_TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

interface PendingSlot {
  gameId: string
  createdAt: number
}

export class QueueManager {
  private state: DurableObjectState
  private totalGPUs = 1
  private activeSessions = new Map<string, ActiveSession>() // userId -> session
  private pendingSlots = new Map<string, PendingSlot>() // userId -> slot info with timestamp
  private queue: QueueEntry[] = []
  private initialized = false

  constructor(state: DurableObjectState) {
    this.state = state
    // Block requests until storage is loaded
    this.state.blockConcurrencyWhile(() => this.load())
  }

  private async load() {
    const stored = await this.state.storage.get<{
      activeSessions: [string, ActiveSession][]
      pendingSlots: [string, PendingSlot | string][] // string for backwards compat with old format
      queue: QueueEntry[]
    }>("state")

    if (stored) {
      this.activeSessions = new Map(stored.activeSessions)
      // Migrate old format (string gameId) to new format (PendingSlot)
      this.pendingSlots = new Map(
        stored.pendingSlots.map(([userId, slot]: [string, PendingSlot | string]) =>
          typeof slot === "string"
            ? [userId, { gameId: slot, createdAt: Date.now() }]
            : [userId, slot],
        ),
      )
      this.queue = stored.queue
    }
    this.initialized = true
  }

  private async save() {
    await this.state.storage.put("state", {
      activeSessions: [...this.activeSessions.entries()],
      pendingSlots: [...this.pendingSlots.entries()],
      queue: this.queue,
    })
  }

  private availableSlots(): number {
    return this.totalGPUs - this.activeSessions.size - this.pendingSlots.size
  }

  private sortQueue() {
    const priority: Record<string, number> = { PRO: 0, BASIC: 1, FREE: 2 }
    this.queue.sort((a, b) => {
      const diff = priority[a.plan] - priority[b.plan]
      return diff !== 0 ? diff : a.joinedAt - b.joinedAt
    })
  }

  private queuePosition(userId: string): number {
    return this.queue.findIndex((e) => e.userId === userId) + 1
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const text = request.method === "POST" ? await request.text() : ""
    const body = text ? JSON.parse(text) : {}

    switch (url.pathname) {
      case "/join":
        return Response.json(await this.handleJoin(body as JoinRequest))
      case "/confirm":
        return Response.json(await this.handleConfirm(body as ConfirmRequest))
      case "/release":
        return Response.json(await this.handleRelease(body as ReleaseRequest))
      case "/status": {
        const userId = url.searchParams.get("userId") ?? ""
        return Response.json(await this.handleStatus(userId))
      }
      case "/reset":
        return Response.json(await this.handleReset())
      default:
        return new Response("Not Found", { status: 404 })
    }
  }

  /** Remove pending slots that have exceeded the timeout (worker crashed / timed out). */
  private expireStalePendingSlots() {
    const now = Date.now()
    for (const [userId, slot] of this.pendingSlots) {
      if (now - slot.createdAt > PENDING_TIMEOUT_MS) {
        console.log(`[queue] Expiring stale pending slot for user ${userId}`)
        this.pendingSlots.delete(userId)
      }
    }
  }

  private async handleJoin(body: JoinRequest): Promise<JoinResponse> {
    const { userId, gameId, plan } = body

    // Clean up any stale pending slots before evaluating availability
    this.expireStalePendingSlots()

    // Already has an active session
    if (this.activeSessions.has(userId)) {
      return { type: "active", session: this.activeSessions.get(userId)! }
    }

    // Already reserved a slot (instance being created)
    if (this.pendingSlots.has(userId)) {
      return { type: "pending" }
    }

    // Already in queue
    if (this.queue.some((e) => e.userId === userId)) {
      return { type: "queued", position: this.queuePosition(userId) }
    }

    // GPU slot available — reserve it
    if (this.availableSlots() > 0) {
      this.pendingSlots.set(userId, { gameId, createdAt: Date.now() })
      await this.save()
      return { type: "ready" }
    }

    // Enqueue
    this.queue.push({ userId, gameId, plan, joinedAt: Date.now() })
    this.sortQueue()
    await this.save()
    return { type: "queued", position: this.queuePosition(userId) }
  }

  private async handleConfirm(body: ConfirmRequest): Promise<ConfirmResponse> {
    const { userId, gameId, instance } = body

    this.pendingSlots.delete(userId)

    const session: ActiveSession = { userId, gameId, instance, startedAt: Date.now() }
    this.activeSessions.set(userId, session)
    await this.save()

    return { type: "active", session }
  }

  private async handleRelease(body: ReleaseRequest): Promise<ReleaseResponse> {
    const { userId } = body

    const session = this.activeSessions.get(userId)
    this.activeSessions.delete(userId)
    this.pendingSlots.delete(userId)

    // Remove from queue if they were waiting (shouldn't happen, but safety)
    this.queue = this.queue.filter((e) => e.userId !== userId)

    // Try to assign next queued user
    let nextEntry: QueueEntry | null = null
    if (this.queue.length > 0 && this.availableSlots() > 0) {
      nextEntry = this.queue.shift()!
      this.pendingSlots.set(nextEntry.userId, { gameId: nextEntry.gameId, createdAt: Date.now() })
    }

    await this.save()

    return {
      freedInstanceId: session?.instance.id ?? null,
      nextEntry,
    }
  }

  private async handleStatus(userId: string): Promise<SessionStatus> {
    // Clean up stale pending slots on every status check (polled every 5s by the client)
    this.expireStalePendingSlots()

    if (this.activeSessions.has(userId)) {
      return { type: "active", session: this.activeSessions.get(userId)! }
    }
    if (this.pendingSlots.has(userId)) {
      return { type: "pending", gameId: this.pendingSlots.get(userId)!.gameId }
    }
    const entry = this.queue.find((e) => e.userId === userId)
    if (entry) {
      return { type: "queued", position: this.queuePosition(userId), gameId: entry.gameId }
    }
    return { type: "idle" }
  }

  private async handleReset() {
    const snapshot = {
      activeSessions: this.activeSessions.size,
      pendingSlots: this.pendingSlots.size,
      queue: this.queue.length,
    }
    this.activeSessions.clear()
    this.pendingSlots.clear()
    this.queue = []
    await this.save()
    return { ok: true, cleared: snapshot }
  }
}
