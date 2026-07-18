"use client"

export interface CheckedInReservation {
  id: string
  guest_name: string
  party_size: number
  reservation_date: string
  table_label: string | null
  event_title: string | null
}

export type CheckinState =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "success"; reservation: CheckedInReservation }
  | { kind: "failure"; message: string }

/**
 * Extracts the token from a scanned payload. QRs encode a full /scan/{token}
 * URL, but older reservations were emailed a bare token, and staff can type
 * either into the manual field — so accept both.
 */
export function extractToken(raw: string): string {
  const value = raw.trim()
  if (!value) return ""
  try {
    const url = new URL(value)
    const segments = url.pathname.split("/").filter(Boolean)
    return decodeURIComponent(segments[segments.length - 1] ?? "")
  } catch {
    return value
  }
}

export async function checkInToken(token: string): Promise<CheckinState> {
  if (!token) {
    return { kind: "failure", message: "No code was read. Try again." }
  }
  try {
    const response = await fetch("/api/reservations/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_code_token: token }),
    })
    const data = await response.json()
    if (!response.ok) {
      return {
        kind: "failure",
        message: data.message ?? "This code could not be checked in.",
      }
    }
    return { kind: "success", reservation: data.reservation }
  } catch {
    return {
      kind: "failure",
      message: "Could not reach the server. Check the connection and try again.",
    }
  }
}

export function CheckinResult({
  state,
  onReset,
}: {
  state: CheckinState
  onReset?: () => void
}) {
  if (state.kind === "idle") return null

  if (state.kind === "working") {
    return (
      <div className="w-full bg-[#141414] p-6 text-center">
        <p className="text-sm text-neutral-400">Checking in…</p>
      </div>
    )
  }

  if (state.kind === "failure") {
    return (
      <div
        role="alert"
        className="w-full border-l-4 border-red-500 bg-red-950/40 p-6 text-center"
      >
        <p className="text-3xl font-bold text-red-400">Not checked in</p>
        <p className="mt-2 text-base text-red-200">{state.message}</p>
        {onReset ? (
          <button
            onClick={onReset}
            className="mt-5 bg-white px-5 py-2 text-sm font-semibold text-[#0a0a0a]"
          >
            Scan next guest
          </button>
        ) : null}
      </div>
    )
  }

  const { reservation } = state
  return (
    <div
      role="status"
      className="w-full border-l-4 border-emerald-500 bg-emerald-950/40 p-6 text-center"
    >
      <p className="text-3xl font-bold text-emerald-400">Checked in</p>
      <p className="mt-3 text-2xl font-semibold text-white">
        {reservation.guest_name}
      </p>
      <p className="mt-1 text-base text-emerald-100">
        Party of {reservation.party_size}
        {reservation.table_label ? ` · Table ${reservation.table_label}` : ""}
      </p>
      {reservation.event_title ? (
        <p className="mt-1 text-sm text-emerald-200/70">{reservation.event_title}</p>
      ) : null}
      {onReset ? (
        <button
          onClick={onReset}
          className="mt-5 bg-white px-5 py-2 text-sm font-semibold text-[#0a0a0a]"
        >
          Scan next guest
        </button>
      ) : null}
    </div>
  )
}
