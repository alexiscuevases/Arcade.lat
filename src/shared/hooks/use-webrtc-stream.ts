import { useState, useRef, useCallback, useEffect } from "react"

// ─── Types ──────────────────────────────────────────────────────────────────

export type StreamState = "idle" | "connecting" | "streaming" | "error"

export type LogLevel = "info" | "warn" | "error" | "success"

export interface UseWebRTCStreamOptions {
  signalingUrl: string
  peerId?: number
  autoConnect?: boolean
  onLog?: (level: LogLevel, message: string) => void
}

export interface UseWebRTCStreamReturn {
  streamState: StreamState
  videoRef: React.RefObject<HTMLVideoElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  inputChannelRef: React.RefObject<RTCDataChannel | null>
  connect: () => void
  disconnect: () => void
  reconnect: () => void
  toggleFullscreen: () => void
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useWebRTCStream({
  signalingUrl,
  peerId = 1,
  autoConnect = false,
  onLog,
}: UseWebRTCStreamOptions): UseWebRTCStreamReturn {
  const [streamState, setStreamState] = useState<StreamState>("idle")

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputChannelRef = useRef<RTCDataChannel | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const log = useCallback(
    (level: LogLevel, message: string) => {
      if (onLog) {
        onLog(level, message)
      } else {
        const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.debug
        fn(`[webrtc] ${message}`)
      }
    },
    [onLog],
  )

  // ─── Connect ────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!signalingUrl) return

    // Clean up existing connections
    if (inputChannelRef.current?.readyState === "open") {
      inputChannelRef.current.send("kr")
      inputChannelRef.current.close()
    }
    wsRef.current?.close()
    inputChannelRef.current = null

    setStreamState("connecting")
    log("info", `Connecting to ${signalingUrl}...`)

    // ─── WebSocket connection ─────────────────────────────────────────

    const ws = new WebSocket(signalingUrl)
    wsRef.current = ws

    ws.onopen = () => {
      log("success", "WebSocket connected")

      // Send HELLO with peer_id and base64-encoded client metadata
      const container = containerRef.current
      const w = container?.clientWidth ?? Math.round(window.innerWidth * window.devicePixelRatio)
      const h = container?.clientHeight ?? Math.round(window.innerHeight * window.devicePixelRatio)
      const meta = { res: `${w}x${h}`, scale: window.devicePixelRatio }
      const metaB64 = btoa(JSON.stringify(meta))

      ws.send(`HELLO ${peerId} ${metaB64}`)
      log("info", `HELLO sent (peer_id=${peerId}, res=${meta.res}, scale=${meta.scale})`)
    }

    ws.onmessage = (event) => {
      const raw = event.data as string
      log("info", `WS message: ${raw.slice(0, 120)}`)
    }

    ws.onerror = () => {
      log("error", "WebSocket error")
      setStreamState("error")
    }

    ws.onclose = (event) => {
      log("warn", `WebSocket closed (code=${event.code})`)
    }
  }, [signalingUrl, peerId, log])

  // ─── Disconnect ───────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (inputChannelRef.current?.readyState === "open") {
      inputChannelRef.current.send("kr")
      inputChannelRef.current.close()
    }
    wsRef.current?.close()
    wsRef.current = null
    inputChannelRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load()
    }
    setStreamState("idle")
    log("info", "Disconnected")
  }, [log])

  // ─── Reconnect ──────────────────────────────────────────────────────

  const reconnect = useCallback(() => {
    disconnect()
    connect()
  }, [connect, disconnect])

  // ─── Fullscreen ───────────────────────────────────────────────────────

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen()
    }
  }, [])

  // ─── Auto-connect lifecycle ───────────────────────────────────────────

  useEffect(() => {
    if (!autoConnect) return
    connect()
    return () => {
      if (inputChannelRef.current?.readyState === "open") {
        inputChannelRef.current.send("kr")
        inputChannelRef.current.close()
      }
      wsRef.current?.close()
      wsRef.current = null
      inputChannelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, signalingUrl])

  return {
    streamState,
    videoRef,
    containerRef,
    inputChannelRef,
    connect,
    disconnect,
    reconnect,
    toggleFullscreen,
  }
}
