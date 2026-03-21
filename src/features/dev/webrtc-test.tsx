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
import { useWebRTCStream, type LogLevel } from "@/shared/hooks/use-webrtc-stream"
import { useInputForwarding } from "@/shared/hooks/use-input-forwarding"

// ─── Types ──────────────────────────────────────────────────────────────────

interface LogEntry {
  time: string
  level: LogLevel
  message: string
}

// ─── Page Component ─────────────────────────────────────────────────────────

export function WebRTCTestPage() {
  // Connection params
  const [ip, setIp] = useState("localhost")
  const [port, setPort] = useState("8080")
  const [token, setToken] = useState("")
  const [protocol, setProtocol] = useState<"ws" | "wss">("ws")

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const onLog = useCallback((level: LogLevel, message: string) => {
    const time = new Date().toLocaleTimeString("es", { hour12: false })
    setLogs((prev) => [...prev.slice(-200), { time, level, message }])
  }, [])

  // Build signaling URL from form params (token appended as query param)
  const signalingUrl = `${protocol}://${ip}:${port}/api/host/stream${token ? `?token=${token}` : ""}`

  // ─── WebRTC stream hook ─────────────────────────────────────────────────

  const {
    streamState,
    videoRef,
    containerRef,
    inputChannelRef,
    muted,
    setMuted,
    connect,
    disconnect,
    toggleFullscreen,
  } = useWebRTCStream({
    signalingUrl,
    autoConnect: false,
    onLog,
  })

  // ─── Input forwarding ───────────────────────────────────────────────────

  useInputForwarding(containerRef, inputChannelRef)

  // ─── Connect wrapper ────────────────────────────────────────────────────

  const handleConnect = useCallback(() => {
    connect()
  }, [connect])

  // ─── UI helpers ─────────────────────────────────────────────────────────

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
                  <label className="text-xs text-muted-foreground mb-1 block">Token</label>
                  <input
                    type="text"
                    placeholder="abc123..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={streamState !== "idle"}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  {streamState === "idle" ? (
                    <Button
                      className="flex-1 gap-1.5"
                      onClick={handleConnect}
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
                        <Button variant="outline" size="icon" onClick={handleConnect}>
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
                  {protocol}://{ip || "IP"}:{port}/api/host/stream{token ? `?token=${token.slice(0, 8)}…` : ""}
                </code>
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
