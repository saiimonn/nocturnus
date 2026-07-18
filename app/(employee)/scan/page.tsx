"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser"
import {
  CheckinResult,
  checkInToken,
  extractToken,
  type CheckinState,
} from "@/components/employee/checkin-result"

const RESET_AFTER_MS = 4000

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [state, setState] = useState<CheckinState>({ kind: "idle" })
  const [cameraError, setCameraError] = useState("")
  const [manualCode, setManualCode] = useState("")

  // Held in a ref so the scan callback (registered once) always sees the
  // current value without re-subscribing the camera on every state change.
  const busyRef = useRef(false)

  const submit = useCallback(async (raw: string) => {
    if (busyRef.current) return
    busyRef.current = true
    setState({ kind: "working" })
    const result = await checkInToken(extractToken(raw))
    setState(result)
  }, [])

  const reset = useCallback(() => {
    busyRef.current = false
    setState({ kind: "idle" })
    setManualCode("")
  }, [])

  // Auto-clear so the next guest can be scanned without touching the screen.
  useEffect(() => {
    if (state.kind !== "success" && state.kind !== "failure") return
    const timer = setTimeout(reset, RESET_AFTER_MS)
    return () => clearTimeout(timer)
  }, [state, reset])

  useEffect(() => {
    const reader = new BrowserQRCodeReader()
    let cancelled = false

    ;(async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result) => {
            if (result) {
              void submit(result.getText())
            }
          },
        )
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
      } catch {
        if (!cancelled) {
          setCameraError(
            "Camera unavailable. Enter the code below instead.",
          )
        }
      }
    })()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [submit])

  return (
    <div className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Scan guest QR</h1>
        <p className="text-sm text-neutral-500">
          Point the camera at the code in the guest&apos;s confirmation email.
        </p>
      </div>

      <div className="relative aspect-square w-full overflow-hidden bg-black ring-1 ring-neutral-800">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {cameraError ? (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-neutral-400">
            {cameraError}
          </p>
        ) : null}
      </div>

      <CheckinResult state={state} onReset={reset} />

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void submit(manualCode)
        }}
        className="space-y-2"
      >
        <label htmlFor="manualCode" className="block text-xs uppercase tracking-wide text-neutral-500">
          Or enter the code manually
        </label>
        <div className="flex gap-2">
          <input
            id="manualCode"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Reservation code"
            className="flex-1 bg-[#141414] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
          />
          <button
            type="submit"
            className="bg-white px-4 py-2 text-sm font-semibold text-[#0a0a0a]"
          >
            Check in
          </button>
        </div>
      </form>
    </div>
  )
}
