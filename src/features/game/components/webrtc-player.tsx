import { useEffect, useRef, useState } from "react"
import { Monitor, Maximize2, Volume2, VolumeX } from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"

interface WebRTCPlayerProps {
  connection: { ip: string; port: number; token: string }
  startedAt: number
  selectedGame?: string
  onEnd: () => void
  isEnding: boolean
}

type StreamState = "connecting" | "streaming" | "error"

export function WebRTCPlayer({
  connection,
  startedAt,
  selectedGame,
  onEnd,
  isEnding,
}: WebRTCPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [streamState, setStreamState] = useState<StreamState>("connecting")
  const [muted, setMuted] = useState(false)

  const elapsed = Math.floor((Date.now() - startedAt) / 1000 / 60)

  useEffect(() => {
    const signalingUrl = `wss://${connection.ip}:${connection.port}/signal?token=${connection.token}`

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })
    pcRef.current = pc

    pc.ontrack = (event) => {
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0]
        setStreamState("streaming")
      }
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      if (state === "failed" || state === "disconnected") {
        setStreamState("error")
      }
    }

    const ws = new WebSocket(signalingUrl)
    wsRef.current = ws

    ws.onopen = async () => {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      ws.send(JSON.stringify({ type: "offer", sdp: offer.sdp }))
    }

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data as string) as
        | { type: "answer"; sdp: string }
        | { type: "ice"; candidate: RTCIceCandidateInit }

      if (msg.type === "answer") {
        await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp })
      } else if (msg.type === "ice") {
        await pc.addIceCandidate(msg.candidate)
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }))
      }
    }

    ws.onerror = () => setStreamState("error")

    return () => {
      pc.close()
      ws.close()
    }
  }, [connection.ip, connection.port, connection.token])

  function toggleFullscreen() {
    if (!videoRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }

  return (
    <Card className="border-green-500/30 bg-green-500/5 overflow-hidden">
      <CardContent className="p-0">
        {/* Stream area */}
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="w-full h-full object-contain"
          />

          {streamState === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/70">
                <Monitor className="size-10 mx-auto mb-3 animate-pulse" />
                <p className="text-sm">Conectando al stream…</p>
              </div>
            </div>
          )}

          {streamState === "error" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-red-400">
                <Monitor className="size-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No se pudo conectar al stream</p>
                <p className="text-xs text-red-400/70 mt-1">Verifica que el servidor esté activo</p>
              </div>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge className="bg-green-500/90 text-white border-0">
              {elapsed}m
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
              onClick={() => setMuted(!muted)}
            >
              {muted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
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
