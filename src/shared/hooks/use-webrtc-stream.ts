import { useState, useRef, useCallback, useEffect } from "react"

// ─── Types ──────────────────────────────────────────────────────────────────

export type StreamState = "idle" | "connecting" | "streaming" | "error"

export type LogLevel = "info" | "warn" | "error" | "success"

export interface UseWebRTCStreamOptions {
  /** Fully-built signaling WebSocket URL (caller handles auth token vs cookie) */
  signalingUrl: string
  /** When true, connects automatically on mount and when signalingUrl changes */
  autoConnect?: boolean
  /** Optional callback for structured logging (test page uses this for its log panel) */
  onLog?: (level: LogLevel, message: string) => void
  /** Number of automatic reconnection attempts on WebSocket close (default 0) */
  maxRetries?: number
  /** Delay in ms between retry attempts (default 2000) */
  retryDelayMs?: number
}

export interface UseWebRTCStreamReturn {
  streamState: StreamState
  videoRef: React.RefObject<HTMLVideoElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  inputChannelRef: React.RefObject<RTCDataChannel | null>
  muted: boolean
  setMuted: (v: boolean) => void
  connect: () => void
  disconnect: () => void
  toggleFullscreen: () => void
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useWebRTCStream({
  signalingUrl,
  autoConnect = false,
  onLog,
  maxRetries = 0,
  retryDelayMs = 2000,
}: UseWebRTCStreamOptions): UseWebRTCStreamReturn {
  const [streamState, setStreamState] = useState<StreamState>("idle")
  const [muted, setMuted] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const inputChannelRef = useRef<RTCDataChannel | null>(null)
  const mediaStreamRef = useRef<MediaStream>(new MediaStream())
  const retryCountRef = useRef(0)

  // Stable log helper — falls back to console.debug when no callback is provided
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

    // Cleanup previous resources
    pcRef.current?.close()
    wsRef.current?.close()
    inputChannelRef.current = null

    setStreamState("connecting")
    log("info", `Connecting to ${signalingUrl}...`)

    // Shared MediaStream — tracks are added dynamically across renegotiations
    const stream = (mediaStreamRef.current = new MediaStream())
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }

    // Buffer ICE candidates that arrive before remote description is set
    const pendingCandidates: RTCIceCandidateInit[] = []
    let pc: RTCPeerConnection | null = null
    let startStreamSent = false

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
        ws.send(
          JSON.stringify({
            WebRtc: { Description: { ty: "answer", sdp: finalSdp } },
          }),
        )
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
          retryCountRef.current = 0
          setStreamState("streaming")
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
            log("info", "StartStream sent")
          }
        }
        if (state === "disconnected") {
          log("warn", "ICE connection disconnected (transient — waiting for recovery)")
        }
        if (state === "failed") {
          setStreamState("error")
          log("error", "ICE connection failed")
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

      ws.send(
        JSON.stringify({
          WebRtc: { Description: { ty: "offer", sdp: offer.sdp } },
        }),
      )
      log("info", "SDP offer sent (datachannel only)")

      // Flush any ICE candidates that arrived before local description
      for (const c of pendingCandidates) {
        await pc.addIceCandidate(c)
      }
      pendingCandidates.length = 0
    }

    // ─── WebSocket signaling ────────────────────────────────────────────

    const ws = new WebSocket(signalingUrl)
    wsRef.current = ws

    ws.onopen = () => {
      log("success", "WebSocket connected — sending Init...")

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
      if (maxRetries > 0 && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        log("info", `Retrying in ${retryDelayMs}ms (attempt ${retryCountRef.current}/${maxRetries})...`)
        setTimeout(connect, retryDelayMs)
      }
    }
  }, [signalingUrl, log, maxRetries, retryDelayMs])

  // ─── Disconnect ───────────────────────────────────────────────────────

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
    retryCountRef.current = 0
    setStreamState("idle")
    log("info", "Disconnected")
  }, [log])

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
      pcRef.current?.close()
      wsRef.current?.close()
      pcRef.current = null
      wsRef.current = null
      inputChannelRef.current = null
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = new MediaStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, signalingUrl])

  return {
    streamState,
    videoRef,
    containerRef,
    inputChannelRef,
    muted,
    setMuted,
    connect,
    disconnect,
    toggleFullscreen,
  }
}
