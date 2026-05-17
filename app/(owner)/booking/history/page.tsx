"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  Armchair,
  Eye,
  CheckCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";

interface BookingRecord {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  bookingDate: Date;
  eventName?: string;
  tableNumber: number;
  tableSize: number;
  time: string;
  specialRequests?: string;
  status: "completed" | "cancelled" | "no-show";
  totalSpent?: number;
}

const fakeHistory: BookingRecord[] = [
  {
    id: "1",
    guestName: "Alex Morgan",
    guestEmail: "alex.morgan@email.com",
    guestPhone: "+1 (555) 123-4567",
    bookingDate: new Date("2026-05-10"),
    eventName: "Friday Night Live",
    tableNumber: 4,
    tableSize: 8,
    time: "10:00 PM",
    specialRequests: "Birthday celebration",
    status: "completed",
    totalSpent: 1250,
  },
  {
    id: "2",
    guestName: "Jordan Chen",
    guestEmail: "jordan.chen@email.com",
    guestPhone: "+1 (555) 234-5678",
    bookingDate: new Date("2026-05-09"),
    eventName: "Saturday Sessions",
    tableNumber: 7,
    tableSize: 6,
    time: "11:00 PM",
    status: "completed",
    totalSpent: 890,
  },
  {
    id: "3",
    guestName: "Sam Rivera",
    guestEmail: "sam.rivera@email.com",
    guestPhone: "+1 (555) 345-6789",
    bookingDate: new Date("2026-05-08"),
    eventName: "The NGHT SHW",
    tableNumber: 2,
    tableSize: 10,
    time: "9:30 PM",
    status: "cancelled",
    totalSpent: 0,
  },
  {
    id: "4",
    guestName: "Taylor Kim",
    guestEmail: "taylor.kim@email.com",
    guestPhone: "+1 (555) 456-7890",
    bookingDate: new Date("2026-05-08"),
    tableNumber: 12,
    tableSize: 4,
    time: "10:30 PM",
    status: "no-show",
    totalSpent: 0,
  },
  {
    id: "5",
    guestName: "Casey Brooks",
    guestEmail: "casey.brooks@email.com",
    guestPhone: "+1 (555) 567-8901",
    bookingDate: new Date("2026-05-07"),
    eventName: "Corechella",
    tableNumber: 1,
    tableSize: 12,
    time: "10:00 PM",
    specialRequests: "Anniversary dinner",
    status: "completed",
    totalSpent: 2100,
  },
  {
    id: "6",
    guestName: "Morgan Lee",
    guestEmail: "morgan.lee@email.com",
    guestPhone: "+1 (555) 678-9012",
    bookingDate: new Date("2026-05-05"),
    tableNumber: 5,
    tableSize: 6,
    time: "9:00 PM",
    status: "completed",
    totalSpent: 720,
  },
  {
    id: "7",
    guestName: "Jamie Wilson",
    guestEmail: "jamie.wilson@email.com",
    guestPhone: "+1 (555) 789-0123",
    bookingDate: new Date("2026-05-04"),
    eventName: "Sunday Funday",
    tableNumber: 8,
    tableSize: 8,
    time: "7:00 PM",
    status: "cancelled",
    totalSpent: 0,
  },
  {
    id: "8",
    guestName: "Riley Davis",
    guestEmail: "riley.davis@email.com",
    guestPhone: "+1 (555) 890-1234",
    bookingDate: new Date("2026-05-03"),
    eventName: "Saturday Sessions",
    tableNumber: 3,
    tableSize: 4,
    time: "10:00 PM",
    status: "completed",
    totalSpent: 450,
  },
];

type FilterStatus = "all" | "completed" | "cancelled" | "no-show";

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>(fakeHistory);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;
  const noShowCount = bookings.filter((b) => b.status === "no-show").length;
  const totalRevenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.totalSpent || 0), 0);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guestEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.eventName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesFilter =
      filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const openDetails = (booking: BookingRecord) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: BookingRecord["status"]) => {
    const styles = {
      completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
      "no-show": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    const labels = {
      completed: "Completed",
      cancelled: "Cancelled",
      "no-show": "No-show",
    };
    const icons = {
      completed: CheckCircle,
      cancelled: XCircle,
      "no-show": MinusCircle,
    };
    const Icon = icons[status];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
      >
        <Icon className="h-3 w-3" />
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Booking History
          </h1>
          <p className="text-sm text-muted-foreground">
            View past reservations and booking outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium text-foreground">
            {completedCount} completed
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold text-foreground">
                {completedCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900/30">
              <XCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-semibold text-foreground">
                {cancelledCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <MinusCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No-shows</p>
              <p className="text-2xl font-semibold text-foreground">
                {noShowCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                $
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(totalRevenue)}
              </p>
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
            {(["all", "completed", "cancelled", "no-show"] as FilterStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status === "no-show" ? "No-show" : status}
                </Button>
              ),
            )}
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <Calendar className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            No bookings found
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Past bookings will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {booking.guestName}
                  </h3>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(booking.bookingDate)}</span>
                  </div>
                  {booking.eventName && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{booking.eventName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Armchair className="h-4 w-4" />
                    <span>Table {booking.tableNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{booking.tableSize} guests</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {booking.status === "completed" && booking.totalSpent && (
                  <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(booking.totalSpent)}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetails(booking)}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
              </DialogHeader>
              <div className="mt-2 grid gap-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedBooking.status)}
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
                      <span className="font-medium text-foreground">
                        {selectedBooking.guestName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-foreground">
                        {selectedBooking.guestEmail}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium text-foreground">
                        {selectedBooking.guestPhone}
                      </span>
                    </div>
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
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-foreground">
                        {formatDate(selectedBooking.bookingDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium text-foreground">
                        {selectedBooking.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Table</span>
                      <span className="font-medium text-foreground">
                        #{selectedBooking.tableNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Party Size</span>
                      <span className="font-medium text-foreground">
                        {selectedBooking.tableSize} guests
                      </span>
                    </div>
                    {selectedBooking.eventName && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Event</span>
                        <span className="font-medium text-foreground">
                          {selectedBooking.eventName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/20 px-4 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Special Requests
                      </span>
                    </div>
                    <p className="p-4 text-sm text-foreground">
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                )}

                {selectedBooking.status === "completed" && selectedBooking.totalSpent && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                    <div className="grid gap-2 p-4">
                      <span className="text-sm text-muted-foreground">
                        Total Spent
                      </span>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(selectedBooking.totalSpent)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}