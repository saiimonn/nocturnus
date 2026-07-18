"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function EmployeeSignOut() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    if (busy) return
    setBusy(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/auth/login")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="text-xs text-neutral-400 underline underline-offset-4 disabled:opacity-50"
    >
      Sign out
    </button>
  )
}
