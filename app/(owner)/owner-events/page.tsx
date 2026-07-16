"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Event } from "@/lib/types";

const statusStyles: Record<Event["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-500/15 text-emerald-600",
  cancelled: "bg-destructive/15 text-destructive",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [clubId, setClubId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStatus, setNewStatus] = useState<Event["status"]>("draft");
  const [newDescription, setNewDescription] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageObjectUrl, setNewImageObjectUrl] = useState<string | null>(
    null,
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<Event["status"]>("draft");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageObjectUrl, setEditImageObjectUrl] = useState<string | null>(
    null,
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const findEvent = (id: string) => events.find((e) => e.id === id) ?? null;

  const handleDeleteEvent = async (id: string) => {
    if (!clubId) return;
    if (!window.confirm("Delete this event? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(
        `/api/owner/clubs/${clubId}/events/${id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (activeId === id) setActiveId(null);
      if (editId === id) {
        setIsEditOpen(false);
        setEditId(null);
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      window.alert("Failed to delete the event. Please try again.");
    }
  };

  const resetAddForm = () => {
    setNewTitle("");
    setNewDate("");
    setNewStatus("draft");
    setNewDescription("");
    setNewImageFile(null);
    if (newImageObjectUrl) URL.revokeObjectURL(newImageObjectUrl);
    setNewImageObjectUrl(null);
  };

  const handleAddEvent = async () => {
    if (!clubId) return;
    if (!newTitle.trim() || !newDate.trim() || !newDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", newTitle.trim());
      formData.append("description", newDescription.trim());
      formData.append(
        "event_date",
        new Date(`${newDate}T00:00:00`).toISOString(),
      );
      formData.append("status", newStatus);
      if (newImageFile) formData.append("image", newImageFile);

      const response = await fetch(`/api/owner/clubs/${clubId}/events`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const { event } = (await response.json()) as { event: Event };
      setEvents((prev) => [event, ...prev]);
      setIsAddOpen(false);
      resetAddForm();
    } catch (error) {
      console.error("Failed to create event:", error);
      window.alert("Failed to create the event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetEditForm = () => {
    setEditTitle("");
    setEditDate("");
    setEditStatus("draft");
    setEditDescription("");
    setEditImageFile(null);
    if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
    setEditImageObjectUrl(null);
  };

  const handleOpenEdit = (id: string) => {
    const event = findEvent(id);
    if (!event) return;
    setEditId(id);
    setEditTitle(event.title);
    setEditDate(event.event_date.slice(0, 10));
    setEditStatus(event.status);
    setEditDescription(event.description ?? "");
    setEditImageFile(null);
    if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
    setEditImageObjectUrl(event.image_url ?? null);
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (editId === null || !clubId) return;
    if (!editTitle.trim() || !editDate.trim() || !editDescription.trim())
      return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", editTitle.trim());
      formData.append("description", editDescription.trim());
      formData.append(
        "event_date",
        new Date(`${editDate}T00:00:00`).toISOString(),
      );
      formData.append("status", editStatus);
      if (editImageFile) formData.append("image", editImageFile);

      const response = await fetch(
        `/api/owner/clubs/${clubId}/events/${editId}`,
        { method: "PATCH", body: formData },
      );
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const { event } = (await response.json()) as { event: Event };
      setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
      setIsEditOpen(false);
      setEditId(null);
      resetEditForm();
    } catch (error) {
      console.error("Failed to update event:", error);
      window.alert("Failed to update the event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (newImageObjectUrl) URL.revokeObjectURL(newImageObjectUrl);
    setNewImageFile(file);
    setNewImageObjectUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleEditImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
    setEditImageFile(file);
    setEditImageObjectUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/owner/events");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as {
          clubId: string | null;
          events: Event[];
        };
        if (!cancelled) {
          setEvents(data.events);
          setClubId(data.clubId);
        }
      } catch (error) {
        console.error("Failed to load owner events:", error);
        if (!cancelled) setLoadError("Failed to load events. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (newImageObjectUrl) URL.revokeObjectURL(newImageObjectUrl);
      if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
    };
  }, [newImageObjectUrl, editImageObjectUrl]);

  const newImagePreview = newImageObjectUrl;
  const editImagePreview = editImageObjectUrl;

  const canSubmitNew =
    !isSubmitting &&
    clubId !== null &&
    newTitle.trim().length > 0 &&
    newDate.trim().length > 0 &&
    newDescription.trim().length > 0;

  const canSubmitEdit =
    !isSubmitting &&
    clubId !== null &&
    editTitle.trim().length > 0 &&
    editDate.trim().length > 0 &&
    editDescription.trim().length > 0;

  const activeEvent = activeId ? findEvent(activeId) : null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Club Events
          </h1>
          <p className="text-sm text-muted-foreground">
            Promote upcoming nights, resident DJs, and special promos.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="px-4"
          disabled={!clubId}
        >
          <Plus />
          Add Event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-90 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">Loading events…</p>
        </div>
      ) : loadError ? (
        <div className="flex min-h-90 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5">
          <h3 className="text-xl font-semibold text-foreground">
            Couldn&apos;t load events
          </h3>
          <p className="text-sm text-muted-foreground">{loadError}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex min-h-90 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <h3 className="text-xl font-semibold text-foreground">
            No events yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Create your first event to start promoting your nights.
          </p>
          <Button
            variant="outline"
            className="px-4"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus />
            Add Event
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
            >
              <div className="relative h-44 w-full overflow-hidden">
                {event.image_url ? (
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  {formatDate(event.event_date)}
                </div>
              </div>
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {event.title}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[event.status]}`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveId(event.id)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenEdit(event.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={activeEvent !== null}
        onOpenChange={() => setActiveId(null)}
      >
        <DialogContent>
          {activeEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{activeEvent.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  {formatDate(activeEvent.event_date)}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[activeEvent.status]}`}
                  >
                    {activeEvent.status}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid gap-4">
                {activeEvent.image_url ? (
                  <div className="relative h-56 w-full overflow-hidden rounded-lg">
                    <Image
                      src={activeEvent.image_url}
                      alt={activeEvent.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 480px"
                    />
                  </div>
                ) : (
                  <div className="flex h-56 w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                    No image
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {activeEvent.description}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(activeEvent.id)}
                >
                  Delete Event
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>
              Fill in the details for the new event.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <Input
                placeholder="Friday Night Live"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
              />
              {!newTitle.trim() && (
                <span className="text-xs text-destructive">
                  Title is required.
                </span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Date
              </label>
              <Input
                type="date"
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
              />
              {!newDate.trim() && (
                <span className="text-xs text-destructive">
                  Date is required.
                </span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                className="rounded-md border border-input bg-transparent px-2.5 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={newStatus}
                onChange={(event) =>
                  setNewStatus(event.target.value as Event["status"])
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Image
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleNewImageFileChange}
              />
              {newImagePreview && (
                <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                  <Image
                    src={newImagePreview}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                    onClick={() => {
                      if (newImageObjectUrl) URL.revokeObjectURL(newImageObjectUrl);
                      setNewImageFile(null);
                      setNewImageObjectUrl(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Describe the event..."
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
              />
              {!newDescription.trim() && (
                <span className="text-xs text-destructive">
                  Description is required.
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddEvent}
              disabled={!canSubmitNew}
            >
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event details.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <Input
                placeholder="Friday Night Live"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
              />
              {!editTitle.trim() && (
                <span className="text-xs text-destructive">
                  Title is required.
                </span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Date
              </label>
              <Input
                type="date"
                value={editDate}
                onChange={(event) => setEditDate(event.target.value)}
              />
              {!editDate.trim() && (
                <span className="text-xs text-destructive">
                  Date is required.
                </span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                className="rounded-md border border-input bg-transparent px-2.5 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={editStatus}
                onChange={(event) =>
                  setEditStatus(event.target.value as Event["status"])
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Image
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleEditImageFileChange}
              />
              {editImagePreview && (
                <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                  <Image
                    src={editImagePreview}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                    onClick={() => {
                      if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
                      setEditImageFile(null);
                      setEditImageObjectUrl(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Describe the event..."
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
              {!editDescription.trim() && (
                <span className="text-xs text-destructive">
                  Description is required.
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditSave}
              disabled={!canSubmitEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
