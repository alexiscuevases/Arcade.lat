import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import {
  Monitor,
  Play,
  Square,
  Maximize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Wifi,
  WifiOff,
  Settings,
  Terminal,
} from "lucide-react"

type StreamState = "idle" | "connecting" | "streaming" | "error"

interface LogEntry {
  time: string
  level: "info" | "warn" | "error" | "success"
  message: string
}

export function WebRTCTestPage() {
  // Connection params
  const [ip, setIp] = useState("localhost")
  const [port, setPort] = useState("8080")
  const [cookie, setCookie] = useState("")
  const [protocol, setProtocol] = useState<"ws" | "wss">("ws")

  // State
  const [streamState, setStreamState] = useState<StreamState>("idle")
  const [muted, setMuted] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const inputChannelRef = useRef<RTCDataChannel | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const mediaStreamRef = useRef<MediaStream>(new MediaStream())

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const log = useCallback((level: LogEntry["level"], message: string) => {
    const time = new Date().toLocaleTimeString("es", { hour12: false })
    setLogs((prev) => [...prev.slice(-200), { time, level, message }])
  }, [])

  // ─── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!ip) return

    // Cleanup previous
    pcRef.current?.close()
    wsRef.current?.close()
    inputChannelRef.current = null

    setStreamState("connecting")
    log("info", `Connecting to ${protocol}://${ip}:${port}...`)

    // Shared MediaStream — tracks are added dynamically across renegotiations
    const stream = mediaStreamRef.current = new MediaStream()
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }

    // Buffer ICE candidates that arrive before remote description is set
    const pendingCandidates: RTCIceCandidateInit[] = []
    let pc: RTCPeerConnection | null = null
    let startStreamSent = false

    // Set mlSession cookie before opening WebSocket (cookies are domain-scoped, not port-scoped)
    if (cookie) {
      document.cookie = `mlSession=${cookie}; path=/`
      log("info", "mlSession cookie set")
    }

    // WebSocket signaling (Sunshine/Moonlight protocol)
    const signalingUrl = `${protocol}://${ip}:${port}/api/host/stream`
    log("info", `Opening WebSocket: ${signalingUrl}`)

    const ws = new WebSocket(signalingUrl)
    wsRef.current = ws

    // Queue to serialize server offer handling
    let negotiationBusy = false
    const pendingOffers: string[] = []

    // Wait for ICE gathering to complete so candidates are included inline in the answer SDP.
    // Sunshine/Moonlight only reads candidates from the SDP body, not trickled via AddIceCandidate.
    function waitForIceGathering(peerConnection: RTCPeerConnection): Promise<void> {
      if (peerConnection.iceGatheringState === "complete") return Promise.resolve()
      return new Promise((resolve) => {
        const onGatheringChange = () => {
          if (peerConnection.iceGatheringState === "complete") {
            peerConnection.removeEventListener("icegatheringstatechange", onGatheringChange)
            resolve()
          }
        }
        peerConnection.addEventListener("icegatheringstatechange", onGatheringChange)
        // Safety timeout — don't block forever
        setTimeout(() => {
          peerConnection.removeEventListener("icegatheringstatechange", onGatheringChange)
          resolve()
        }, 5000)
      })
    }

    async function handleOffer(sdp: string) {
      if (!pc) return
      if (pc.signalingState !== "stable") {
        await pc.setLocalDescription({ type: "rollback" })
      }
      await pc.setRemoteDescription({ type: "offer", sdp })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Wait for ICE candidates to be gathered so they're inline in the SDP
      await waitForIceGathering(pc)
      const finalSdp = pc.localDescription!.sdp

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          WebRtc: { Description: { ty: "answer", sdp: finalSdp } },
        }))
      }
      log("info", `SDP answer sent (renegotiation, ${finalSdp.length} bytes)`)
    }

    async function processOfferQueue() {
      if (negotiationBusy) return
      negotiationBusy = true
      while (pendingOffers.length > 0) {
        const sdp = pendingOffers.shift()!
        try {
          await handleOffer(sdp)
        } catch (err) {
          log("error", `Failed to handle offer: ${err}`)
        }
      }
      negotiationBusy = false
    }

    function setupPeerConnection(iceServers: RTCIceServer[]) {
      pc = new RTCPeerConnection({ iceServers })
      pcRef.current = pc

      // Remote tracks → add to shared MediaStream
      pc.ontrack = (event) => {
        log("success", `Track received: ${event.track.kind} (id=${event.track.id.slice(0, 8)})`)
        stream.addTrack(event.track)
        event.track.onended = () => {
          log("warn", `Track ended: ${event.track.kind}`)
          stream.removeTrack(event.track)
        }
        setStreamState("streaming")
      }

      // Server creates the datachannel — capture it
      pc.ondatachannel = (event) => {
        inputChannelRef.current = event.channel
        event.channel.onopen = () => log("success", `DataChannel "${event.channel.label}" opened`)
        event.channel.onclose = () => log("warn", `DataChannel "${event.channel.label}" closed`)
      }

      // ICE connection state
      pc.oniceconnectionstatechange = () => {
        if (!pc) return
        const state = pc.iceConnectionState
        log("info", `ICE connection state: ${state}`)
        if (state === "connected" || state === "completed") {
          setStreamState("streaming")
          // Send StartStream once ICE connects
          if (!startStreamSent && ws.readyState === WebSocket.OPEN) {
            startStreamSent = true
            ws.send(JSON.stringify({
              StartStream: {
                bitrate: 10000,
                packet_size: 2048,
                fps: 60,
                width: 1920,
                height: 1080,
                play_audio_local: false,
                video_supported_formats: 1,
                video_colorspace: "Rec709",
                video_color_range_full: false,
                hdr: false,
              },
            }))
            log("info", "StartStream sent")
          }
        }
        if (state === "disconnected") {
          log("warn", `ICE connection disconnected (transient — waiting for recovery)`)
        }
        if (state === "failed") {
          setStreamState("error")
          log("error", `ICE connection failed`)
        }
      }

      pc.onicegatheringstatechange = () => {
        if (!pc) return
        log("info", `ICE gathering state: ${pc.iceGatheringState}`)
      }

      pc.onsignalingstatechange = () => {
        if (!pc) return
        log("info", `Signaling state: ${pc.signalingState}`)
      }

      // Forward trickle ICE candidates to server (Moonlight format)
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          const c = event.candidate.toJSON()
          ws.send(JSON.stringify({
            WebRtc: {
              AddIceCandidate: {
                candidate: c.candidate,
                sdp_mid: c.sdpMid,
                sdp_mline_index: c.sdpMLineIndex,
                username_fragment: c.usernameFragment,
              },
            },
          }))
          log("info", `Sent ICE candidate: ${event.candidate.candidate.slice(0, 60)}...`)
        }
      }
    }

    async function createAndSendOffer() {
      if (!pc) return

      // Create datachannel + offer (NO transceivers — server adds media via renegotiation)
      const dc = pc.createDataChannel("input")
      inputChannelRef.current = dc
      dc.onopen = () => log("success", `DataChannel "input" opened`)
      dc.onclose = () => log("warn", `DataChannel "input" closed`)

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      ws.send(JSON.stringify({
        WebRtc: { Description: { ty: "offer", sdp: offer.sdp } },
      }))
      log("info", "SDP offer sent (datachannel only)")

      // Flush any ICE candidates that arrived before local description
      for (const c of pendingCandidates) {
        await pc.addIceCandidate(c)
      }
      pendingCandidates.length = 0
    }

    ws.onopen = () => {
      log("success", "WebSocket connected — sending Init...")

      // Step 1: Send Init (then wait for Setup from server)
      ws.send(JSON.stringify({
        Init: {
          host_id: 2555575343,
          app_id: 303580669,
          video_frame_queue_size: 3,
          audio_sample_queue_size: 20,
        },
      }))
      log("info", "Init sent — waiting for Setup...")
    }

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data as string)

        if (msg.DebugLog) {
          log("info", `[sunshine] ${msg.DebugLog.message}`)
          return
        }

        // Server sends Setup with ICE servers → create PC with them, send SetTransport + offer
        if (msg.Setup) {
          const iceServers: RTCIceServer[] = (msg.Setup.ice_servers ?? []).map(
            (s: { urls: string[] }) => ({ urls: s.urls }),
          )
          log("success", `Setup received: ${iceServers.length} ICE server(s)`)

          setupPeerConnection(iceServers)

          // Step 2: Respond with SetTransport
          ws.send(JSON.stringify({ SetTransport: "WebRTC" }))
          log("info", "SetTransport: WebRTC sent")

          // Step 3: Create offer
          await createAndSendOffer()
          return
        }

        if (msg.UpdateApp) {
          log("info", `UpdateApp: ${msg.UpdateApp.app?.title ?? "unknown"}`)
          return
        }

        if (msg.ConnectionComplete) {
          const c = msg.ConnectionComplete
          log("success", `ConnectionComplete: ${c.width}x${c.height}@${c.fps}fps`)
          setStreamState("streaming")
          return
        }

        if (msg.WebRtc?.Description) {
          const { ty, sdp } = msg.WebRtc.Description as { ty: string; sdp: string }
          log("info", `WebRtc.Description ty=${ty} (${sdp.length} bytes)`)

          if (ty === "answer" && pc) {
            await pc.setRemoteDescription({ type: "answer", sdp })
            log("success", "Remote description set (server answer)")
            // Flush buffered ICE candidates
            for (const c of pendingCandidates) {
              await pc.addIceCandidate(c)
            }
            pendingCandidates.length = 0
          } else if (ty === "offer") {
            // Server renegotiates to add video, then audio
            pendingOffers.push(sdp)
            processOfferQueue()
          }
          return
        }

        if (msg.WebRtc?.AddIceCandidate) {
          const c = msg.WebRtc.AddIceCandidate
          const candidate: RTCIceCandidateInit = {
            candidate: c.candidate,
            sdpMid: c.sdp_mid,
            sdpMLineIndex: c.sdp_mline_index,
          }
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(candidate)
            log("info", "Added remote ICE candidate")
          } else {
            pendingCandidates.push(candidate)
            log("info", "Buffered ICE candidate (no remote description yet)")
          }
          return
        }

        log("warn", `Unknown message: ${JSON.stringify(msg).slice(0, 120)}`)
      } catch (err) {
        log("error", `Signaling error: ${err}`)
      }
    }

    ws.onerror = () => {
      log("error", "WebSocket error")
      setStreamState("error")
    }

    ws.onclose = (event) => {
      log("warn", `WebSocket closed (code=${event.code}, reason=${event.reason || "none"})`)
    }
  }, [ip, port, cookie, protocol, log])

  // ─── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    pcRef.current?.close()
    wsRef.current?.close()
    pcRef.current = null
    wsRef.current = null
    inputChannelRef.current = null
    // Stop all tracks and detach
    mediaStreamRef.current.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = new MediaStream()
    if (videoRef.current) videoRef.current.srcObject = null
    setStreamState("idle")
    log("info", "Disconnected")
  }, [log])

  // ─── Input forwarding ────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function sendInput(payload: object) {
      const ch = inputChannelRef.current
      if (ch && ch.readyState === "open") {
        ch.send(JSON.stringify(payload))
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      sendInput({ type: "keydown", code: e.code, key: e.key })
    }
    function onKeyUp(e: KeyboardEvent) {
      e.preventDefault()
      sendInput({ type: "keyup", code: e.code, key: e.key })
    }
    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect()
      sendInput({
        type: "mousemove",
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      })
    }
    function onMouseDown(e: MouseEvent) {
      sendInput({ type: "mousedown", button: e.button })
    }
    function onMouseUp(e: MouseEvent) {
      sendInput({ type: "mouseup", button: e.button })
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      sendInput({ type: "wheel", deltaX: e.deltaX, deltaY: e.deltaY })
    }
    function onContextMenu(e: Event) {
      e.preventDefault()
    }

    container.addEventListener("keydown", onKeyDown)
    container.addEventListener("keyup", onKeyUp)
    container.addEventListener("mousemove", onMouseMove)
    container.addEventListener("mousedown", onMouseDown)
    container.addEventListener("mouseup", onMouseUp)
    container.addEventListener("wheel", onWheel, { passive: false })
    container.addEventListener("contextmenu", onContextMenu)

    return () => {
      container.removeEventListener("keydown", onKeyDown)
      container.removeEventListener("keyup", onKeyUp)
      container.removeEventListener("mousemove", onMouseMove)
      container.removeEventListener("mousedown", onMouseDown)
      container.removeEventListener("mouseup", onMouseUp)
      container.removeEventListener("wheel", onWheel)
      container.removeEventListener("contextmenu", onContextMenu)
    }
  }, [])

  // ─── Fullscreen ───────────────────────────────────────────────────────────

  function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen()
    }
  }

  const stateColor = {
    idle: "bg-zinc-500",
    connecting: "bg-yellow-500 animate-pulse",
    streaming: "bg-green-500",
    error: "bg-red-500",
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              WebRTC Test
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Conecta directamente a una instancia con signaling WebSocket
            </p>
          </div>
          <Badge className={`${stateColor[streamState]} text-white border-0`}>
            {streamState === "idle" && "Desconectado"}
            {streamState === "connecting" && "Conectando…"}
            {streamState === "streaming" && "Streaming"}
            {streamState === "error" && "Error"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: params + logs */}
          <div className="space-y-4">
            {/* Connection params */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wifi className="size-4" />
                  Conexion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">IP de la instancia</label>
                  <input
                    type="text"
                    placeholder="34.123.45.67"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    disabled={streamState !== "idle"}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Puerto</label>
                    <input
                      type="text"
                      placeholder="47989"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      disabled={streamState !== "idle"}
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Protocolo</label>
                    <select
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value as "ws" | "wss")}
                      disabled={streamState !== "idle"}
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="ws">ws://</option>
                      <option value="wss">wss://</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cookie (mlSession)</label>
                  <input
                    type="text"
                    placeholder="cbdd32b927bd654622ae401acbd1196f..."
                    value={cookie}
                    onChange={(e) => setCookie(e.target.value)}
                    disabled={streamState !== "idle"}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  {streamState === "idle" ? (
                    <Button
                      className="flex-1 gap-1.5"
                      onClick={connect}
                      disabled={!ip}
                    >
                      <Play className="size-3.5 fill-current" />
                      Conectar
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        className="flex-1 gap-1.5"
                        onClick={disconnect}
                      >
                        <Square className="size-3.5 fill-current" />
                        Desconectar
                      </Button>
                      {streamState === "error" && (
                        <Button variant="outline" size="icon" onClick={connect}>
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Signaling URL preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">URL de signaling</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-xs break-all text-primary/80">
                  {protocol}://{ip || "IP"}:{port}/api/host/stream
                </code>
                {cookie && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Cookie: mlSession={cookie.slice(0, 16)}…
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Logs */}
            <Card className="max-h-[400px] flex flex-col">
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Terminal className="size-4" />
                    Logs
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setLogs([])}
                  >
                    Limpiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto min-h-0 pb-3">
                {logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Los logs aparecerán aquí al conectar...
                  </p>
                ) : (
                  <div className="space-y-0.5 font-mono text-[11px]">
                    {logs.map((entry, i) => (
                      <div key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-muted-foreground shrink-0">{entry.time}</span>
                        <span
                          className={
                            entry.level === "error"
                              ? "text-red-400"
                              : entry.level === "warn"
                                ? "text-yellow-400"
                                : entry.level === "success"
                                  ? "text-green-400"
                                  : "text-foreground/70"
                          }
                        >
                          {entry.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: video player */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-0">
                <div
                  ref={containerRef}
                  tabIndex={0}
                  className="relative aspect-video bg-black outline-none"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-contain"
                  />

                  {streamState === "idle" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white/40">
                        <WifiOff className="size-12 mx-auto mb-3" />
                        <p className="text-sm">Sin conexion</p>
                        <p className="text-xs mt-1">Ingresa los parametros y conecta</p>
                      </div>
                    </div>
                  )}

                  {streamState === "connecting" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white/60">
                        <Monitor className="size-12 mx-auto mb-3 animate-pulse" />
                        <p className="text-sm">Conectando al stream…</p>
                        <p className="text-xs text-white/30 mt-1">
                          Negociando WebRTC con {ip}:{port}
                        </p>
                      </div>
                    </div>
                  )}

                  {streamState === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-red-400">
                        <Monitor className="size-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">Conexion fallida</p>
                        <p className="text-xs text-red-400/70 mt-1">
                          Revisa los logs para mas detalles
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status indicator */}
                  {streamState !== "idle" && (
                    <div className="absolute top-3 left-3">
                      <Badge className={`${stateColor[streamState]} text-white border-0 text-xs`}>
                        {streamState}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Controls bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t bg-background">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setMuted(!muted)}
                    >
                      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={toggleFullscreen}
                    >
                      <Maximize2 className="size-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Haz click en el video y usa teclado/mouse para enviar input
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Protocolo Sunshine/Moonlight</CardTitle>
                <CardDescription className="text-xs">
                  El servidor inicia la negociacion — el cliente solo responde con answers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-primary font-semibold">Servidor → Cliente</p>
                    <p className="text-muted-foreground">{'{ DebugLog: { message } }'}</p>
                    <p className="text-muted-foreground">{'{ WebRtc: { Description: { ty: "offer", sdp } } }'}</p>
                    <p className="text-muted-foreground">{'{ ConnectionComplete: { width, height, fps } }'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-primary font-semibold">Cliente → Servidor</p>
                    <p className="text-muted-foreground">{'{ WebRtc: { Description: { ty: "answer", sdp } } }'}</p>
                    <p className="text-muted-foreground">{'{ WebRtc: { Candidate: { ... } } }'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-primary font-semibold">Input (DataChannel)</p>
                    <p className="text-muted-foreground">{'{ type: "keydown", code }'}</p>
                    <p className="text-muted-foreground">{'{ type: "mousemove", x, y }'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
