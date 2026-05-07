import { Button } from "@/components/ui/button";

const stats = [
  {
    label: "Total revenue",
    value: "$138,920",
    delta: "+9.7%",
    helper: "vs last 30 days",
  },
  {
    label: "Tickets sold",
    value: "9,816",
    delta: "+11.3%",
    helper: "rolling 30 days",
  },
  {
    label: "Avg spend",
    value: "$42.10",
    delta: "+4.5%",
    helper: "per guest",
  },
  {
    label: "Upcoming events",
    value: "7",
    delta: "+3",
    helper: "next 14 days",
  },
  {
    label: "Floor occupancy",
    value: "88%",
    delta: "+6%",
    helper: "Fri-Sun avg",
  },
  {
    label: "New members",
    value: "286",
    delta: "+21%",
    helper: "last 7 days",
  },
];

const flowStages = [
  {
    title: "Discover",
    detail: "Search + social referrals",
    metric: "24%",
  },
  {
    title: "Reserve",
    detail: "Ticket + table booking",
    metric: "12%",
  },
  {
    title: "Check-in",
    detail: "Door + VIP validation",
    metric: "9%",
  },
  {
    title: "On-floor",
    detail: "Spend + stay duration",
    metric: "7%",
  },
  {
    title: "Return",
    detail: "Membership retention",
    metric: "4%",
  },
];

const activity = [
  {
    title: "Friday Night Live sold out",
    time: "2 hours ago",
    note: "VIP tables at 98% capacity",
  },
  {
    title: "DJ Corechella added",
    time: "5 hours ago",
    note: "Event boosted in social feed",
  },
  {
    title: "Table 4 moved to premium",
    time: "Yesterday",
    note: "+$1,200 projected revenue",
  },
  {
    title: "Member tier upgrades",
    time: "2 days ago",
    note: "32 guests moved to Gold",
  },
];

const peakNights = [
  { label: "Friday", value: 92 },
  { label: "Saturday", value: 86 },
  { label: "Thursday", value: 64 },
  { label: "Wednesday", value: 42 },
];

export default function OwnerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Good evening, Bro
          </h1>
          <p className="text-sm text-muted-foreground">
            Track the night, manage events, and keep guest flow smooth.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">View bookings</Button>
          <Button>Create event</Button>
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
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                {stat.delta}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Night outlook
            </h2>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span>VIP tables remaining</span>
              <span className="font-medium text-foreground">6</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span>Projected bar sales</span>
              <span className="font-medium text-foreground">$18.4k</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span>Staffing coverage</span>
              <span className="font-medium text-foreground">92%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span>Security alert</span>
              <span className="font-medium text-foreground">All clear</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Activity feed
            </h2>
          </div>
          <div className="mt-5 grid gap-4">
            {activity.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
