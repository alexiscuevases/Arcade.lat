import { useEffect, useRef, useState, useCallback } from "react"
import { Monitor, Maximize2, Volume2, VolumeX, RotateCcw } from "lucide-react"
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

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

export function WebRTCPlayer({
  connection,
  startedAt,
  selectedGame,
  onEnd,
  isEnding,
}: WebRTCPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const inputChannelRef = useRef<RTCDataChannel | null>(null)
  const mediaStreamRef = useRef<MediaStream>(new MediaStream())
  const retryCountRef = useRef(0)

  const [streamState, setStreamState] = useState<StreamState>("connecting")
  const [muted, setMuted] = useState(false)
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

  // ─── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    // Cleanup previous
    pcRef.current?.close()
    wsRef.current?.close()
    inputChannelRef.current = null

    setStreamState("connecting")

    // Shared MediaStream — tracks added dynamically across renegotiations
    const stream = (mediaStreamRef.current = new MediaStream())
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }

    // Buffer ICE candidates that arrive before remote description is set
    const pendingCandidates: RTCIceCandidateInit[] = []
    let pc: RTCPeerConnection | null = null
    let startStreamSent = false

    // Queue to serialize offer handling (server sends offers rapidly for video then audio)
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
        ws.send(
          JSON.stringify({
            WebRtc: { Description: { ty: "answer", sdp: finalSdp } },
          }),
        )
      }
    }

    async function processOfferQueue() {
      if (negotiationBusy) return
      negotiationBusy = true
      while (pendingOffers.length > 0) {
        const sdp = pendingOffers.shift()!
        try {
          await handleOffer(sdp)
        } catch (err) {
          console.error("[webrtc] Failed to handle offer:", err)
        }
      }
      negotiationBusy = false
    }

    function setupPeerConnection(iceServers: RTCIceServer[]) {
      pc = new RTCPeerConnection({ iceServers })
      pcRef.current = pc

      // Remote tracks → add to shared MediaStream
      pc.ontrack = (event) => {
        stream.addTrack(event.track)
        event.track.onended = () => stream.removeTrack(event.track)
        setStreamState("streaming")
      }

      // Server creates the datachannel — capture it
      pc.ondatachannel = (event) => {
        inputChannelRef.current = event.channel
      }

      pc.oniceconnectionstatechange = () => {
        if (!pc) return
        const state = pc.iceConnectionState
        if (state === "connected" || state === "completed") {
          retryCountRef.current = 0
          // Send StartStream once ICE connects
          if (!startStreamSent && ws.readyState === WebSocket.OPEN) {
            startStreamSent = true
            ws.send(
              JSON.stringify({
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
              }),
            )
            console.debug("[webrtc] StartStream sent")
          }
        }
        // "disconnected" is transient — ICE can recover after renegotiation
        if (state === "failed") {
          setStreamState("error")
        }
      }

      // Forward trickle ICE candidates to server (Moonlight format)
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          const c = event.candidate.toJSON()
          ws.send(
            JSON.stringify({
              WebRtc: {
                AddIceCandidate: {
                  candidate: c.candidate,
                  sdp_mid: c.sdpMid,
                  sdp_mline_index: c.sdpMLineIndex,
                  username_fragment: c.usernameFragment,
                },
              },
            }),
          )
        }
      }
    }

    async function createAndSendOffer() {
      if (!pc) return

      const dc = pc.createDataChannel("input")
      inputChannelRef.current = dc

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      ws.send(
        JSON.stringify({
          WebRtc: { Description: { ty: "offer", sdp: offer.sdp } },
        }),
      )
      console.debug("[webrtc] SDP offer sent (datachannel only)")

      // Flush any ICE candidates that arrived before local description
      for (const c of pendingCandidates) {
        await pc.addIceCandidate(c)
      }
      pendingCandidates.length = 0
    }

    // Signaling via WebSocket
    const protocol = location.protocol === "https:" ? "wss" : "ws"
    const signalingUrl = `${protocol}://${connection.ip}:${connection.port}/api/host/stream?token=${connection.token}`

    const ws = new WebSocket(signalingUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.debug("[webrtc] WebSocket connected — sending Init")

      // Step 1: Send Init (then wait for Setup from server)
      ws.send(
        JSON.stringify({
          Init: {
            host_id: 2555575343,
            app_id: 303580669,
            video_frame_queue_size: 3,
            audio_sample_queue_size: 20,
          },
        }),
      )
    }

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data as string)

        if (msg.DebugLog) {
          console.debug("[sunshine]", msg.DebugLog.message)
          return
        }

        // Server sends Setup with ICE servers → create PC, send SetTransport + offer
        if (msg.Setup) {
          const iceServers: RTCIceServer[] = (msg.Setup.ice_servers ?? []).map(
            (s: { urls: string[] }) => ({ urls: s.urls }),
          )
          console.debug("[webrtc] Setup received:", iceServers.length, "ICE server(s)")

          setupPeerConnection(iceServers)

          ws.send(JSON.stringify({ SetTransport: "WebRTC" }))
          await createAndSendOffer()
          return
        }

        if (msg.UpdateApp) return // Acknowledged, no action needed

        if (msg.WebRtc?.Description) {
          const { ty, sdp } = msg.WebRtc.Description as {
            ty: string
            sdp: string
          }
          if (ty === "offer") {
            // Server renegotiates to add video, then audio
            pendingOffers.push(sdp)
            processOfferQueue()
          } else if (ty === "answer" && pc) {
            await pc.setRemoteDescription({ type: "answer", sdp })
            // Flush buffered ICE candidates
            for (const c of pendingCandidates) {
              await pc.addIceCandidate(c)
            }
            pendingCandidates.length = 0
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
          } else {
            pendingCandidates.push(candidate)
          }
          return
        }

        if (msg.ConnectionComplete) {
          console.log("[webrtc] ConnectionComplete:", msg.ConnectionComplete)
          setStreamState("streaming")
          return
        }
      } catch (err) {
        console.error("[webrtc] Signaling message error:", err)
      }
    }

    ws.onerror = () => {
      console.error("[webrtc] WebSocket error")
      setStreamState("error")
    }

    ws.onclose = () => {
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++
        setTimeout(connect, RETRY_DELAY_MS)
      }
    }
  }, [connection.ip, connection.port, connection.token])

  // ─── Initial connection ───────────────────────────────────────────────────

  useEffect(() => {
    connect()
    return () => {
      pcRef.current?.close()
      wsRef.current?.close()
      pcRef.current = null
      wsRef.current = null
      inputChannelRef.current = null
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = new MediaStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.ip, connection.port, connection.token])

  // ─── Input forwarding (keyboard + mouse → DataChannel) ───────────────────

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

  function handleRetry() {
    retryCountRef.current = 0
    connect()
  }

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
            muted={muted}
            className="w-full h-full object-contain"
          />

          {streamState === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/70">
                <Monitor className="size-10 mx-auto mb-3 animate-pulse" />
                <p className="text-sm">Conectando al stream…</p>
                <p className="text-xs text-white/40 mt-1">
                  Estableciendo conexión WebRTC
                </p>
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
                  onClick={handleRetry}
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
