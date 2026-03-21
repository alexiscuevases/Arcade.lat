import { useEffect } from "react"

/**
 * Forwards keyboard, mouse, and wheel events from a container element
 * to the remote host via an RTCDataChannel (JSON-serialized).
 */
export function useInputForwarding(
  containerRef: React.RefObject<HTMLDivElement | null>,
  inputChannelRef: React.RefObject<RTCDataChannel | null>,
) {
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
  }, [containerRef, inputChannelRef])
}
