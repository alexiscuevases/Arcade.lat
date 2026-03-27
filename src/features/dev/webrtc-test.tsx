import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import {
  Monitor,
  Play,
  Square,
  Maximize2,
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
  const [host, setHost] = useState("rtc.arcade.lat")
  const [path, setPath] = useState("/webrtc/signalling/")
  const [token, setToken] = useState("")
  const [protocol, setProtocol] = useState<"ws" | "wss">("wss")

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

  // Build WSS URL from form params
  const signalingUrl = `${protocol}://${host}${path}${token ? `?token=${token}` : ""}`

  // ─── WebRTC stream hook ─────────────────────────────────────────────────

  const {
    streamState,
    videoRef,
    containerRef,
    inputChannelRef,
    connect,
    disconnect,
    reconnect,
    toggleFullscreen,
  } = useWebRTCStream({
    signalingUrl,
    autoConnect: false,
    onLog,
  })

  // ─── Input forwarding ───────────────────────────────────────────────────

  useInputForwarding(containerRef, inputChannelRef)

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
              Conecta directamente a una instancia con WebSocket
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
                  <label className="text-xs text-muted-foreground mb-1 block">Host</label>
                  <input
                    type="text"
                    placeholder="rtc.arcade.lat"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    disabled={streamState !== "idle"}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Path</label>
                    <input
                      type="text"
                      placeholder="/webrtc/signalling/"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
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
                      onClick={connect}
                      disabled={!host}
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
                      <Button variant="outline" size="icon" onClick={reconnect} title="Reconectar">
                        <RotateCcw className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* WSS URL preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">URL de conexion</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-xs break-all text-primary/80">
                  {protocol}://{host || "host"}{path}{token ? `?token=${token.slice(0, 8)}…` : ""}
                </code>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card className="max-h-100 flex flex-col">
              <CardHeader className="pb-2 shrink-0">
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
                        <p className="text-sm">Conectando…</p>
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
                    <div className="absolute top-3 left-3 flex items-center gap-2">
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
                      onClick={toggleFullscreen}
                      title="Pantalla completa (Ctrl+Shift+F)"
                    >
                      <Maximize2 className="size-4" />
                    </Button>
                    {streamState !== "idle" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={reconnect}
                        title="Reconectar"
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Haz click en el video y usa teclado/mouse para enviar input
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
