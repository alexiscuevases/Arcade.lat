import { useEffect, useState, useMemo } from "react"
import { Monitor, Maximize2, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { useWebRTCStream } from "@/shared/hooks/use-webrtc-stream"
import { useInputForwarding } from "@/shared/hooks/use-input-forwarding"

// ─── Types ──────────────────────────────────────────────────────────────────

interface WebRTCPlayerProps {
  connection: { ip: string; port: number; token: string }
  startedAt: number
  selectedGame?: string
  onEnd: () => void
  isEnding: boolean
}

// ─── Component ──────────────────────────────────────────────────────────────

export function WebRTCPlayer({
  connection,
  startedAt,
  selectedGame,
  onEnd,
  isEnding,
}: WebRTCPlayerProps) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - startedAt) / 1000),
  )

  // Live elapsed timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // Build WSS URL with token auth
  const signalingUrl = useMemo(() => {
    const protocol = location.protocol === "https:" ? "wss" : "ws"
    return `${protocol}://${connection.ip}:${connection.port}/ws?token=${connection.token}`
  }, [connection.ip, connection.port, connection.token])

  // ─── WebRTC stream hook ─────────────────────────────────────────────────

  const {
    streamState,
    videoRef,
    containerRef,
    inputChannelRef,
    reconnect,
    toggleFullscreen,
  } = useWebRTCStream({
    signalingUrl,
    autoConnect: true,
  })

  // ─── Input forwarding ───────────────────────────────────────────────────

  useInputForwarding(containerRef, inputChannelRef)

  return (
    <Card className="border-green-500/30 bg-green-500/5 overflow-hidden">
      <CardContent className="p-0">
        {/* Stream area */}
        <div
          ref={containerRef}
          tabIndex={0}
          className="relative aspect-video bg-black outline-none cursor-none"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />

          {streamState === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/70">
                <Monitor className="size-10 mx-auto mb-3 animate-pulse" />
                <p className="text-sm">Conectando…</p>
              </div>
            </div>
          )}

          {streamState === "error" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-red-400">
                <Monitor className="size-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  No se pudo conectar al stream
                </p>
                <p className="text-xs text-red-400/70 mt-1">
                  Verifica que el servidor esté activo
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={reconnect}
                >
                  <RotateCcw className="size-3" />
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
            <Badge className="bg-green-500/90 text-white border-0">
              {formatTime(elapsed)}
            </Badge>
            {selectedGame && (
              <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm">
                {selectedGame}
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
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
            {streamState === "streaming" && (
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

          <Button
            variant="destructive"
            size="sm"
            onClick={onEnd}
            disabled={isEnding}
          >
            {isEnding ? "Terminando…" : "Terminar sesión"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
