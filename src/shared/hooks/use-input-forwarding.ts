import { useEffect, useRef, useCallback } from "react"

// ─── X11 Keysym mapping ─────────────────────────────────────────────────────

const KEY_TO_KEYSYM: Record<string, number> = {
  Backspace: 0xff08,
  Tab: 0xff09,
  Enter: 0xff0d,
  Escape: 0xff1b,
  Delete: 0xffff,
  Home: 0xff50,
  ArrowLeft: 0xff51,
  ArrowUp: 0xff52,
  ArrowRight: 0xff53,
  ArrowDown: 0xff54,
  PageUp: 0xff55,
  PageDown: 0xff56,
  End: 0xff57,
  Insert: 0xff63,
  ShiftLeft: 0xffe1,
  ShiftRight: 0xffe2,
  ControlLeft: 0xffe3,
  ControlRight: 0xffe4,
  CapsLock: 0xffe5,
  MetaLeft: 0xffe7,
  MetaRight: 0xffe8,
  AltLeft: 0xffe9,
  AltRight: 0xffea,
  F1: 0xffbe,
  F2: 0xffbf,
  F3: 0xffc0,
  F4: 0xffc1,
  F5: 0xffc2,
  F6: 0xffc3,
  F7: 0xffc4,
  F8: 0xffc5,
  F9: 0xffc6,
  F10: 0xffc7,
  F11: 0xffc8,
  F12: 0xffc9,
  Space: 0x0020,
  NumLock: 0xff7f,
  ScrollLock: 0xff14,
  PrintScreen: 0xff61,
  Pause: 0xff13,
}

function keyToKeysym(e: KeyboardEvent): number {
  const special = KEY_TO_KEYSYM[e.code]
  if (special !== undefined) return special

  if (e.key.length === 1) {
    return e.key.charCodeAt(0)
  }

  return e.keyCode
}

// ─── Mouse button mask ──────────────────────────────────────────────────────
// Selkies button mask: bit 0 = left, bit 1 = middle, bit 2 = right

function buttonsToBitmask(buttons: number): number {
  let mask = 0
  if (buttons & 1) mask |= 1 // left
  if (buttons & 4) mask |= 2 // middle
  if (buttons & 2) mask |= 4 // right
  return mask
}

// ─── Browser shortcuts to intercept (per Selkies reference) ─────────────────

const BLOCKED_SHORTCUTS: Set<string> = new Set(["F5", "F11"])

function isBlockedShortcut(e: KeyboardEvent): boolean {
  if (BLOCKED_SHORTCUTS.has(e.code)) return true
  // Block Ctrl+I (dev tools) to prevent accidental opening
  if (e.ctrlKey && e.code === "KeyI" && !e.shiftKey) return true
  return false
}

// ─── Scroll normalization (trackpad vs mouse, per Selkies reference) ────────

const TRACKPAD_SCROLL_THRESHOLD_MS = 100

interface ScrollState {
  lastTime: number
  isTrackpad: boolean
}

function normalizeScroll(
  deltaY: number,
  deltaMode: number,
  state: ScrollState,
): number {
  const now = Date.now()
  // Detect trackpad: very frequent small deltas
  if (now - state.lastTime < TRACKPAD_SCROLL_THRESHOLD_MS && Math.abs(deltaY) < 50) {
    state.isTrackpad = true
  } else if (Math.abs(deltaY) >= 50) {
    state.isTrackpad = false
  }
  state.lastTime = now

  let magnitude: number
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    magnitude = Math.sign(deltaY) * -10
  } else if (state.isTrackpad) {
    // Normalize trackpad to 0-10 range
    magnitude = Math.sign(deltaY) * -Math.min(Math.ceil(Math.abs(deltaY) / 12), 10)
  } else {
    // Mouse wheel: discrete scroll units
    magnitude = deltaY < 0 ? 1 : -1
  }

  return magnitude
}

// ─── Coordinate scaling (client → server, per Selkies reference) ────────────

function getScaledCoords(
  e: MouseEvent | Touch,
  video: HTMLVideoElement,
): { x: number; y: number } | null {
  const rect = video.getBoundingClientRect()

  // Get the actual rendered video dimensions (accounts for object-fit: contain)
  const videoWidth = video.videoWidth || rect.width
  const videoHeight = video.videoHeight || rect.height

  // Calculate the actual video display area within the element (object-fit: contain)
  const elementAspect = rect.width / rect.height
  const videoAspect = videoWidth / videoHeight

  let displayWidth: number
  let displayHeight: number
  let offsetX: number
  let offsetY: number

  if (elementAspect > videoAspect) {
    // Letterboxed (black bars on sides)
    displayHeight = rect.height
    displayWidth = rect.height * videoAspect
    offsetX = (rect.width - displayWidth) / 2
    offsetY = 0
  } else {
    // Pillarboxed (black bars top/bottom)
    displayWidth = rect.width
    displayHeight = rect.width / videoAspect
    offsetX = 0
    offsetY = (rect.height - displayHeight) / 2
  }

  // Convert client coordinates to video-relative coordinates
  const relX = e.clientX - rect.left - offsetX
  const relY = e.clientY - rect.top - offsetY

  // Clamp to video bounds
  const clampedX = Math.max(0, Math.min(relX, displayWidth))
  const clampedY = Math.max(0, Math.min(relY, displayHeight))

  // Scale to actual video resolution
  const x = Math.round((clampedX / displayWidth) * videoWidth)
  const y = Math.round((clampedY / displayHeight) * videoHeight)

  return { x, y }
}

// ─── Gamepad support (per Selkies js,* protocol) ────────────────────────────

interface GamepadState {
  connected: Set<number>
  axes: Map<number, Float32Array>
  buttons: Map<number, Uint8Array>
  rafId: number | null
}

function initGamepadPolling(send: (msg: string) => void, state: GamepadState) {
  function poll() {
    const gamepads = navigator.getGamepads()
    for (const gp of gamepads) {
      if (!gp) continue

      if (!state.connected.has(gp.index)) {
        // New gamepad connected
        state.connected.add(gp.index)
        state.axes.set(gp.index, new Float32Array(gp.axes.length))
        state.buttons.set(gp.index, new Uint8Array(gp.buttons.length))
        const idB64 = btoa(gp.id)
        send(`js,c,${gp.index},${idB64},${gp.axes.length},${gp.buttons.length}`)
      }

      // Check buttons
      const prevButtons = state.buttons.get(gp.index)!
      for (let b = 0; b < gp.buttons.length; b++) {
        const val = Math.round(gp.buttons[b].value * 255)
        if (val !== prevButtons[b]) {
          prevButtons[b] = val
          send(`js,b,${gp.index},${b},${val}`)
        }
      }

      // Check axes
      const prevAxes = state.axes.get(gp.index)!
      for (let a = 0; a < gp.axes.length; a++) {
        // Normalize axis from [-1,1] to [0,255]
        const val = Math.round(((gp.axes[a] + 1) / 2) * 255)
        const prevVal = Math.round(((prevAxes[a] + 1) / 2) * 255)
        if (val !== prevVal) {
          prevAxes[a] = gp.axes[a]
          send(`js,a,${gp.index},${a},${val}`)
        }
      }
    }

    // Check for disconnected gamepads
    for (const idx of state.connected) {
      const gp = gamepads[idx]
      if (!gp || !gp.connected) {
        state.connected.delete(idx)
        state.axes.delete(idx)
        state.buttons.delete(idx)
        send(`js,d,${idx}`)
      }
    }

    state.rafId = requestAnimationFrame(poll)
  }

  state.rafId = requestAnimationFrame(poll)
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useInputForwarding(
  containerRef: React.RefObject<HTMLDivElement | null>,
  inputChannelRef: React.RefObject<RTCDataChannel | null>,
) {
  const scrollStateRef = useRef<ScrollState>({ lastTime: 0, isTrackpad: false })
  const gamepadStateRef = useRef<GamepadState>({
    connected: new Set(),
    axes: new Map(),
    buttons: new Map(),
    rafId: null,
  })

  const send = useCallback((msg: string) => {
    const ch = inputChannelRef.current
    if (ch && ch.readyState === "open") {
      ch.send(msg)
    }
  }, [inputChannelRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function getVideo(): HTMLVideoElement | null {
      return container!.querySelector("video")
    }

    // ─── Keyboard ─────────────────────────────────────────────────────

    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()

      // Block browser shortcuts that interfere with remote session
      if (isBlockedShortcut(e)) return

      // Hotkey: Ctrl+Shift+F for fullscreen
      if (e.ctrlKey && e.shiftKey && e.code === "KeyF") {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          container!.requestFullscreen()
        }
        return
      }

      send(`kd,${keyToKeysym(e)}`)
    }

    function onKeyUp(e: KeyboardEvent) {
      e.preventDefault()
      send(`ku,${keyToKeysym(e)}`)
    }

    // ─── Mouse (scaled coordinates) ───────────────────────────────────

    function onMouseMove(e: MouseEvent) {
      // Use relative motion if pointer is locked
      if (document.pointerLockElement === container) {
        send(`m2,${Math.round(e.movementX)},${Math.round(e.movementY)},${buttonsToBitmask(e.buttons)},0`)
        return
      }
      const video = getVideo()
      if (!video) return
      const coords = getScaledCoords(e, video)
      if (!coords) return
      send(`m,${coords.x},${coords.y},${buttonsToBitmask(e.buttons)},0`)
    }

    function onMouseDown(e: MouseEvent) {
      e.preventDefault()
      // Request pointer lock on click for FPS-style games
      if (document.pointerLockElement !== container) {
        container!.requestPointerLock?.()
      }
      const video = getVideo()
      if (!video) return
      const coords = getScaledCoords(e, video)
      if (!coords) return
      send(`m,${coords.x},${coords.y},${buttonsToBitmask(e.buttons)},0`)
    }

    function onMouseUp(e: MouseEvent) {
      const video = getVideo()
      if (!video) return
      const coords = getScaledCoords(e, video)
      if (!coords) return
      send(`m,${coords.x},${coords.y},${buttonsToBitmask(e.buttons)},0`)
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const video = getVideo()
      if (!video) return
      const coords = getScaledCoords(e, video)
      if (!coords) return
      const magnitude = normalizeScroll(e.deltaY, e.deltaMode, scrollStateRef.current)
      send(`m,${coords.x},${coords.y},${buttonsToBitmask(e.buttons)},${magnitude}`)
    }

    // ─── Touch events (per Selkies reference) ─────────────────────────

    let touchButtonMask = 0

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      touchButtonMask |= 1 // left button
      const video = getVideo()
      if (!video || !e.touches[0]) return
      const coords = getScaledCoords(e.touches[0], video)
      if (!coords) return
      send(`m,${coords.x},${coords.y},${touchButtonMask},0`)
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      const video = getVideo()
      if (!video || !e.touches[0]) return
      const coords = getScaledCoords(e.touches[0], video)
      if (!coords) return
      send(`m,${coords.x},${coords.y},${touchButtonMask},0`)
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault()
      touchButtonMask &= ~1 // release left button
      const video = getVideo()
      if (!video) return
      // Use last known position from changedTouches
      const touch = e.changedTouches[0]
      if (!touch) return
      const coords = getScaledCoords(touch, video)
      if (!coords) return
      send(`m,${coords.x},${coords.y},${touchButtonMask},0`)
    }

    function onContextMenu(e: Event) {
      e.preventDefault()
    }

    // ─── Pointer visibility (hide local cursor when over container) ───

    function onPointerEnter() {
      send("p,0") // hide remote pointer (we use local cursor or pointer lock)
    }

    function onPointerLeave() {
      send("p,1") // show remote pointer
    }

    // ─── Bind events ─────────────────────────────────────────────────

    container.addEventListener("keydown", onKeyDown)
    container.addEventListener("keyup", onKeyUp)
    container.addEventListener("mousemove", onMouseMove)
    container.addEventListener("mousedown", onMouseDown)
    container.addEventListener("mouseup", onMouseUp)
    container.addEventListener("wheel", onWheel, { passive: false })
    container.addEventListener("touchstart", onTouchStart, { passive: false })
    container.addEventListener("touchmove", onTouchMove, { passive: false })
    container.addEventListener("touchend", onTouchEnd, { passive: false })
    container.addEventListener("contextmenu", onContextMenu)
    container.addEventListener("pointerenter", onPointerEnter)
    container.addEventListener("pointerleave", onPointerLeave)

    // ─── Gamepad polling ──────────────────────────────────────────────

    const gpState = gamepadStateRef.current
    initGamepadPolling(send, gpState)

    return () => {
      container.removeEventListener("keydown", onKeyDown)
      container.removeEventListener("keyup", onKeyUp)
      container.removeEventListener("mousemove", onMouseMove)
      container.removeEventListener("mousedown", onMouseDown)
      container.removeEventListener("mouseup", onMouseUp)
      container.removeEventListener("wheel", onWheel)
      container.removeEventListener("touchstart", onTouchStart)
      container.removeEventListener("touchmove", onTouchMove)
      container.removeEventListener("touchend", onTouchEnd)
      container.removeEventListener("contextmenu", onContextMenu)
      container.removeEventListener("pointerenter", onPointerEnter)
      container.removeEventListener("pointerleave", onPointerLeave)

      // Stop gamepad polling
      if (gpState.rafId !== null) {
        cancelAnimationFrame(gpState.rafId)
        gpState.rafId = null
      }
      // Send disconnect for all gamepads
      for (const idx of gpState.connected) {
        send(`js,d,${idx}`)
      }
      gpState.connected.clear()
      gpState.axes.clear()
      gpState.buttons.clear()

      // Exit pointer lock on cleanup
      if (document.pointerLockElement === container) {
        document.exitPointerLock()
      }
    }
  }, [containerRef, inputChannelRef, send])
}
