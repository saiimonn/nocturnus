"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";

interface BookingRequest {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  requestDate: Date;
  eventName?: string;
  tableNumber: number;
  tableSize: number;
  preferredTime: string;
  specialRequests?: string;
  status: "pending" | "approved" | "declined";
}

const fakeRequests: BookingRequest[] = [
  {
    id: "1",
    guestName: "Alex Morgan",
    guestEmail: "alex.morgan@email.com",
    guestPhone: "+1 (555) 123-4567",
    requestDate: new Date("2026-05-15"),
    eventName: "Friday Night Live",
    tableNumber: 4,
    tableSize: 8,
    preferredTime: "10:00 PM",
    specialRequests: "Birthday celebration - need cake service",
    status: "pending",
  },
  {
    id: "2",
    guestName: "Jordan Chen",
    guestEmail: "jordan.chen@email.com",
    guestPhone: "+1 (555) 234-5678",
    requestDate: new Date("2026-05-15"),
    eventName: "Saturday Sessions",
    tableNumber: 7,
    tableSize: 6,
    preferredTime: "11:00 PM",
    status: "pending",
  },
  {
    id: "3",
    guestName: "Sam Rivera",
    guestEmail: "sam.rivera@email.com",
    guestPhone: "+1 (555) 345-6789",
    requestDate: new Date("2026-05-14"),
    eventName: "The NGHT SHW",
    tableNumber: 2,
    tableSize: 10,
    preferredTime: "9:30 PM",
    specialRequests: "VIP bottle service preferred",
    status: "pending",
  },
  {
    id: "4",
    guestName: "Taylor Kim",
    guestEmail: "taylor.kim@email.com",
    guestPhone: "+1 (555) 456-7890",
    requestDate: new Date("2026-05-14"),
    tableNumber: 12,
    tableSize: 4,
    preferredTime: "10:30 PM",
    status: "pending",
  },
  {
    id: "5",
    guestName: "Casey Brooks",
    guestEmail: "casey.brooks@email.com",
    guestPhone: "+1 (555) 567-8901",
    requestDate: new Date("2026-05-13"),
    eventName: "Corechella",
    tableNumber: 1,
    tableSize: 12,
    preferredTime: "10:00 PM",
    specialRequests: "Anniversary dinner - private area if possible",
    status: "pending",
  },
];

type FilterStatus = "all" | "pending" | "approved" | "declined";

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>(fakeRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const declinedCount = requests.filter((r) => r.status === "declined").length;

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.guestEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.eventName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesFilter =
      filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "approved" } : req)),
    );
    setSelectedRequest(null);
    setIsDetailsOpen(false);
  };

  const handleDecline = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "declined" } : req)),
    );
    setSelectedRequest(null);
    setIsDetailsOpen(false);
  };

  const openDetails = (request: BookingRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusBadge = (status: BookingRequest["status"]) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    const labels = {
      pending: "Pending",
      approved: "Approved",
      declined: "Declined",
    };
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold text-foreground">
                {pendingCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-semibold text-foreground">
                {approvedCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <X className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Declined</p>
              <p className="text-2xl font-semibold text-foreground">
                {declinedCount}
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
            {(["all", "pending", "approved", "declined"] as FilterStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ),
            )}
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <Calendar className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            No requests found
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "New booking requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {request.guestName}
                  </h3>
                  {getStatusBadge(request.status)}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {request.eventName && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{request.eventName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Armchair className="h-4 w-4" />
                    <span>Table {request.tableNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{request.preferredTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{request.tableSize} guests</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetails(request)}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View Request
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Booking Request</DialogTitle>
              </DialogHeader>
              <div className="mt-2 grid gap-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedRequest.status)}
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
                        {selectedRequest.guestName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-foreground">
                        {selectedRequest.guestEmail}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium text-foreground">
                        {selectedRequest.guestPhone}
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
                      <span className="text-muted-foreground">Table</span>
                      <span className="font-medium text-foreground">
                        #{selectedRequest.tableNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Party Size</span>
                      <span className="font-medium text-foreground">
                        {selectedRequest.tableSize} guests
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Preferred Time</span>
                      <span className="font-medium text-foreground">
                        {selectedRequest.preferredTime}
                      </span>
                    </div>
                    {selectedRequest.eventName && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Event</span>
                        <span className="font-medium text-foreground">
                          {selectedRequest.eventName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Requested</span>
                      <span className="font-medium text-foreground">
                        {formatDate(selectedRequest.requestDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedRequest.specialRequests && (
                  <div className="rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/20 px-4 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Special Requests
                      </span>
                    </div>
                    <p className="p-4 text-sm text-foreground">
                      {selectedRequest.specialRequests}
                    </p>
                  </div>
                )}
              </div>
              {selectedRequest.status === "pending" && (
                <DialogFooter className="mt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDecline(selectedRequest.id)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Decline
                  </Button>
                  <Button onClick={() => handleApprove(selectedRequest.id)}>
                    <Check className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}