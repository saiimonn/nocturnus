"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type Phase = "checking" | "invalid" | "ready" | "submitting"

function EmployeeRegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [phase, setPhase] = useState<Phase>(token ? "checking" : "invalid")
  const [inviteError, setInviteError] = useState(
    token ? "" : "This link is missing its invitation code."
  )
  const [email, setEmail] = useState("")
  const [clubName, setClubName] = useState("")

  const [fullName, setFullName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!token) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch("/api/auth/employee-invite/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await response.json()
        if (cancelled) return
        if (!response.ok) {
          setPhase("invalid")
          setInviteError(data.message ?? "This invitation is invalid or has expired.")
          return
        }
        setEmail(data.email)
        setClubName(data.clubName)
        setPhase("ready")
      } catch {
        if (cancelled) return
        setPhase("invalid")
        setInviteError("Could not verify this invitation. Check your connection and try again.")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError("")

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.")
      return
    }

    setPhase("submitting")
    try {
      const response = await fetch("/api/auth/employee-invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          full_name: fullName,
          password,
          contact_number: contactNumber || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setFormError(data.message ?? "Could not complete registration.")
        setPhase("ready")
        return
      }
      router.push("/scan")
      router.refresh()
    } catch {
      setFormError("Something went wrong. Please try again.")
      setPhase("ready")
    }
  }

  if (phase === "checking") {
    return <p className="text-sm text-neutral-400">Checking your invitation…</p>
  }

  if (phase === "invalid") {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-white">Invitation unavailable</h1>
        <p className="text-sm text-neutral-400">{inviteError}</p>
        <p className="text-sm text-neutral-500">
          Ask your club owner to send a new invitation.
        </p>
      </div>
    )
  }

  const busy = phase === "submitting"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Join {clubName}</h1>
        <p className="text-sm text-neutral-400">
          Set up your account to start checking guests in.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-wide text-neutral-500">
          Email
        </label>
        <input
          type="email"
          value={email}
          readOnly
          aria-describedby="email-note"
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-neutral-400 outline-none ring-1 ring-neutral-800"
        />
        <p id="email-note" className="text-xs text-neutral-600">
          This invitation is tied to this address and cannot be changed.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="block text-xs uppercase tracking-wide text-neutral-500">
          Full name
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contactNumber" className="block text-xs uppercase tracking-wide text-neutral-500">
          Contact number <span className="text-neutral-700">(optional)</span>
        </label>
        <input
          id="contactNumber"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs uppercase tracking-wide text-neutral-500">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
        />
        <p className="text-xs text-neutral-600">At least 8 characters.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-wide text-neutral-500">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
        />
      </div>

      {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-white px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Creating your account…" : "Create account"}
      </button>
    </form>
  )
}

export default function EmployeeRegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm bg-[#141414] p-8">
        <Suspense fallback={<p className="text-sm text-neutral-400">Loading…</p>}>
          <EmployeeRegisterForm />
        </Suspense>
      </div>
    </main>
  )
}
