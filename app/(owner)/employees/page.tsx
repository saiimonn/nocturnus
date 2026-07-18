"use client"

import { useCallback, useEffect, useState } from "react"

interface Employee {
  id: string
  full_name: string
  email: string
  contact_number: string | null
  status: "active" | "suspended"
  created_at: string
}

interface Invite {
  id: string
  email: string
  expires_at: string
  created_at: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteNotice, setInviteNotice] = useState("")

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/owner/employees")
      const data = await response.json()
      if (!response.ok) {
        setLoadError(data.message ?? "Could not load employees.")
        return
      }
      setEmployees(data.employees ?? [])
      setInvites(data.invites ?? [])
      setLoadError("")
    } catch {
      setLoadError("Could not reach the server.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault()
    setInviteError("")
    setInviteNotice("")
    setInviting(true)
    try {
      const response = await fetch("/api/owner/employees/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setInviteError(data.message ?? "Could not send the invite.")
        return
      }
      setInviteNotice(`Invitation sent to ${data.invite.email}.`)
      setEmail("")
      await load()
    } catch {
      setInviteError("Could not reach the server.")
    } finally {
      setInviting(false)
    }
  }

  async function handleRevoke(inviteId: string) {
    const response = await fetch(`/api/owner/employees/invites/${inviteId}`, {
      method: "DELETE",
    })
    if (response.ok) {
      await load()
    }
  }

  async function handleToggleStatus(employee: Employee) {
    const response = await fetch(`/api/owner/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: employee.status === "active" ? "suspended" : "active",
      }),
    })
    if (response.ok) {
      await load()
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading employees…</p>
  }

  if (loadError) {
    return <p className="p-6 text-sm text-destructive">{loadError}</p>
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="text-sm text-muted-foreground">
          Invite door staff to check guests in. They can only access the scan
          screen.
        </p>
      </div>

      <form onSubmit={handleInvite} className="max-w-md space-y-2">
        <label htmlFor="inviteEmail" className="block text-sm font-medium">
          Invite by email
        </label>
        <div className="flex gap-2">
          <input
            id="inviteEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="flex-1 border bg-background px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={inviting}
            className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {inviting ? "Sending…" : "Invite"}
          </button>
        </div>
        {inviteError ? <p className="text-sm text-destructive">{inviteError}</p> : null}
        {inviteNotice ? <p className="text-sm text-muted-foreground">{inviteNotice}</p> : null}
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pending invitations
        </h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        ) : (
          <ul className="divide-y border">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(invite.id)}
                  className="text-xs text-destructive underline underline-offset-4"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Employees
        </h2>
        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No employees yet. Invite someone above.
          </p>
        ) : (
          <ul className="divide-y border">
            {employees.map((employee) => (
              <li key={employee.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm">{employee.full_name}</p>
                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      employee.status === "active"
                        ? "text-xs text-emerald-600"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {employee.status === "active" ? "Active" : "Suspended"}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(employee)}
                    className="text-xs underline underline-offset-4"
                  >
                    {employee.status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
