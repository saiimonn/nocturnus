import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  club,
  clubTables,
  events,
  reservations,
  tableMap,
} from "@/lib/mock-data-owner"

const now = new Date()

const greeting =
  now.getHours() < 12
    ? "Good morning"
    : now.getHours() < 18
      ? "Good afternoon"
      : "Good evening"

const pending = reservations.filter((r) => r.status === "pending")
const confirmed = reservations.filter((r) => r.status === "confirmed")
const activeTables = clubTables.filter((t) => t.is_available)
const upcomingEvents = events.filter(
  (e) => e.status === "published" && new Date(e.event_date) > now
)

const estimatedRevenue = confirmed.reduce((sum, r) => {
  const table = tableMap.get(r.table_id)
  return sum + (table?.minimum_spend ?? 0)
}, 0)

const totalPartySize = reservations.reduce((sum, r) => sum + r.party_size, 0)

const stats = [
  {
    label: "Total Reservations",
    value: reservations.length.toString(),
    sub: "all time",
  },
  {
    label: "Pending Requests",
    value: pending.length.toString(),
    sub: "awaiting review",
    highlight: pending.length > 0,
  },
  {
    label: "Confirmed Bookings",
    value: confirmed.length.toString(),
    sub: "upcoming",
  },
  {
    label: "Active Tables",
    value: `${activeTables.length} / ${clubTables.length}`,
    sub: "available on floor",
  },
  {
    label: "Upcoming Events",
    value: upcomingEvents.length.toString(),
    sub: "published",
  },
]

const recentReservations = [...reservations]
  .sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  .slice(0, 5)

const statusStyles: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 border border-yellow-200",
  confirmed:
    "bg-green-100 text-green-800 border border-green-200",
  checked_in:
    "bg-blue-100 text-blue-800 border border-blue-200",
  cancelled:
    "bg-red-100 text-red-800 border border-red-200",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function OwnerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            {greeting}, {club.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {club.address}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/booking/requests"
            className={buttonVariants({ variant: "outline" })}
          >
            View bookings
          </Link>
          <Link href="/events" className={buttonVariants()}>
            Create event
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </div>
              {stat.highlight && (
                <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800 border border-yellow-200">
                  Action needed
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Tonight&apos;s overview
          </h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span>Reservations today</span>
              <span className="font-medium text-foreground">
                {
                  reservations.filter(
                    (r) =>
                      formatDate(r.reservation_date) === formatDate(now.toISOString())
                  ).length
                }
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span>Total party size</span>
              <span className="font-medium text-foreground">
                {totalPartySize} guests
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span>Estimated revenue</span>
              <span className="font-medium text-foreground">
                ₱{estimatedRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span>Tables available</span>
              <span className="font-medium text-foreground">
                {activeTables.length} of {clubTables.length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent reservations
            </h2>
            <Link
              href="/booking/requests"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View all
            </Link>
          </div>
          <div className="mt-5 grid gap-4">
            {recentReservations.map((r) => {
              const table = tableMap.get(r.table_id)
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      {r.guest_name}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[r.status]}`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {table?.label ?? "Unknown table"} &middot;{" "}
                    {r.party_size} pax &middot;{" "}
                    {formatDateTime(r.reservation_date)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Upcoming events
          </h2>
            <Link
              href="/events"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View all
            </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {event.title}
                </p>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 border border-green-200">
                  {event.status}
                </span>
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDateTime(event.event_date)}
              </p>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">
              No upcoming published events.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
