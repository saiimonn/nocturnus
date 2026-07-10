"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Check,
  X,
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  Armchair,
  Eye,
} from "lucide-react"
import type { Reservation } from "@/lib/types"
import { reservations as initialReservations, tableMap, events } from "@/lib/mock-data-owner"

type FilterStatus = "all" | "pending" | "confirmed" | "cancelled"

export default function BookingRequestsPage() {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const pendingCount = reservations.filter((r) => r.status === "pending").length
  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length
  const cancelledCount = reservations.filter((r) => r.status === "cancelled").length

  const filteredReservations = reservations.filter((r) => {
    const event = r.event_id ? events.find((e) => e.id === r.event_id) : null
    const matchesSearch =
      r.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.guest_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event?.title.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesFilter = filterStatus === "all" || r.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleConfirm = (id: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "confirmed" as const,
              qr_code_token: crypto.randomUUID(),
              updated_at: new Date().toISOString(),
            }
          : r
      )
    )
    setSelectedReservation(null)
    setIsDetailsOpen(false)
  }

  const handleDecline = (id: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "cancelled" as const, updated_at: new Date().toISOString() }
          : r
      )
    )
    setSelectedReservation(null)
    setIsDetailsOpen(false)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

  const getStatusBadge = (status: Reservation["status"]) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border border-green-200",
      cancelled: "bg-red-100 text-red-800 border border-red-200",
      completed: "bg-muted text-muted-foreground border border-border",
      checked_in: "bg-blue-100 text-blue-800 border border-blue-200",
    }
    const labels: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      completed: "Completed",
      checked_in: "Checked in",
    }
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Booking Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and manage table reservation requests from guests.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {pendingCount} pending
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold text-foreground">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-semibold text-foreground">{confirmedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-semibold text-foreground">{cancelledCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 rounded-md bg-muted p-1">
            {(["all", "pending", "confirmed", "cancelled"] as FilterStatus[]).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <Calendar className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">No requests found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "New booking requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReservations.map((r) => {
            const table = tableMap.get(r.table_id)
            const event = r.event_id ? events.find((e) => e.id === r.event_id) : null
            return (
              <div
                key={r.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{r.guest_name}</h3>
                    {getStatusBadge(r.status)}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {event && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{event.title}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Armchair className="h-4 w-4" />
                      <span>{table?.label ?? "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{formatDateTime(r.reservation_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{r.party_size} guests</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedReservation(r); setIsDetailsOpen(true) }}>
                    <Eye className="mr-1 h-4 w-4" />
                    View Request
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedReservation && (
            <>
              <DialogHeader>
                <DialogTitle>Booking Request</DialogTitle>
              </DialogHeader>
              <div className="mt-2 grid gap-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedReservation.status)}
                </div>

                <div className="rounded-lg border border-border">
                  <div className="border-b border-border bg-muted/20 px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Guest Details
                    </span>
                  </div>
                  <div className="grid gap-3 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground">{selectedReservation.guest_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-foreground">{selectedReservation.guest_email}</span>
                    </div>
                    {selectedReservation.guest_contact && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium text-foreground">{selectedReservation.guest_contact}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border">
                  <div className="border-b border-border bg-muted/20 px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Reservation Details
                    </span>
                  </div>
                  <div className="grid gap-3 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Table</span>
                      <span className="font-medium text-foreground">
                        {tableMap.get(selectedReservation.table_id)?.label ?? "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Party Size</span>
                      <span className="font-medium text-foreground">{selectedReservation.party_size} guests</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-foreground">{formatDateTime(selectedReservation.reservation_date)}</span>
                    </div>
                    {selectedReservation.event_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Event</span>
                        <span className="font-medium text-foreground">
                          {events.find((e) => e.id === selectedReservation.event_id)?.title ?? "Unknown"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Requested</span>
                      <span className="font-medium text-foreground">{formatDate(selectedReservation.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {selectedReservation.status === "pending" && (
                <DialogFooter className="mt-2">
                  <Button variant="outline" onClick={() => handleDecline(selectedReservation.id)}>
                    <X className="mr-1 h-4 w-4" />
                    Decline
                  </Button>
                  <Button onClick={() => handleConfirm(selectedReservation.id)}>
                    <Check className="mr-1 h-4 w-4" />
                    Confirm
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
