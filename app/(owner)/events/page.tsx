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
import { events as initialEvents } from "@/lib/mock-data-owner";
import type { Event } from "@/lib/types";

const statusStyles: Record<Event["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-500/15 text-emerald-600",
  cancelled: "bg-destructive/15 text-destructive",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStatus, setNewStatus] = useState<Event["status"]>("draft");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageObjectUrl, setNewImageObjectUrl] = useState<string | null>(
    null,
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<Event["status"]>("draft");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
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

  const handleDeleteEvent = (id: string) => {
    if (!window.confirm("Delete this event? This action cannot be undone.")) {
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (activeId === id) setActiveId(null);
    if (editId === id) {
      setIsEditOpen(false);
      setEditId(null);
    }
  };

  const resetAddForm = () => {
    setNewTitle("");
    setNewDate("");
    setNewStatus("draft");
    setNewDescription("");
    setNewImageUrl("");
    if (newImageObjectUrl) URL.revokeObjectURL(newImageObjectUrl);
    setNewImageObjectUrl(null);
  };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !newDate.trim() || !newDescription.trim()) return;

    const image = newImageObjectUrl ?? (newImageUrl.trim() || null);

    const nextEvent: Event = {
      id: crypto.randomUUID(),
      club_id: initialEvents[0]?.club_id ?? "",
      title: newTitle.trim(),
      description: newDescription.trim(),
      image_url: image,
      event_date: new Date(`${newDate}T00:00:00`).toISOString(),
      status: newStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEvents((prev) => [nextEvent, ...prev]);
    setIsAddOpen(false);
    resetAddForm();
  };

  const resetEditForm = () => {
    setEditTitle("");
    setEditDate("");
    setEditStatus("draft");
    setEditDescription("");
    setEditImageUrl("");
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
    setEditImageUrl(event.image_url ?? "");
    if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
    setEditImageObjectUrl(null);
    setIsEditOpen(true);
  };

  const handleEditSave = () => {
    if (editId === null) return;
    if (!editTitle.trim() || !editDate.trim() || !editDescription.trim())
      return;

    const image = editImageObjectUrl ?? (editImageUrl.trim() || null);

    setEvents((prev) =>
      prev.map((event) =>
        event.id === editId
          ? {
              ...event,
              title: editTitle.trim(),
              event_date: new Date(`${editDate}T00:00:00`).toISOString(),
              status: editStatus,
              description: editDescription.trim(),
              image_url: image,
              updated_at: new Date().toISOString(),
            }
          : event,
      ),
    );

    setIsEditOpen(false);
    setEditId(null);
    resetEditForm();
  };

  const handleNewImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (newImageObjectUrl) URL.revokeObjectURL(newImageObjectUrl);
    setNewImageObjectUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleEditImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
    setEditImageObjectUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (newImageObjectUrl) URL.revokeObjectURL(newImageObjectUrl);
      if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
    };
  }, [newImageObjectUrl, editImageObjectUrl]);

  const newImagePreview = newImageObjectUrl ?? (newImageUrl.trim() || null);
  const editImagePreview = editImageObjectUrl ?? (editImageUrl.trim() || null);

  const canSubmitNew =
    newTitle.trim().length > 0 &&
    newDate.trim().length > 0 &&
    newDescription.trim().length > 0;

  const canSubmitEdit =
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

        <Button onClick={() => setIsAddOpen(true)} className="px-4">
          <Plus />
          Add Event
        </Button>
      </div>

      {events.length === 0 ? (
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
              <Input
                placeholder="https://example.com/banner.jpg"
                value={newImageUrl}
                onChange={(event) => setNewImageUrl(event.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Upload a file or paste an image URL.
              </span>
              {newImagePreview && (
                <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                  <Image
                    src={newImagePreview}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                    onClick={() => {
                      if (newImageObjectUrl) URL.revokeObjectURL(newImageObjectUrl);
                      setNewImageObjectUrl(null);
                      setNewImageUrl("");
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
              <Input
                placeholder="https://example.com/banner.jpg"
                value={editImageUrl}
                onChange={(event) => setEditImageUrl(event.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Upload a file or paste an image URL.
              </span>
              {editImagePreview && (
                <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                  <Image
                    src={editImagePreview}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                    onClick={() => {
                      if (editImageObjectUrl) URL.revokeObjectURL(editImageObjectUrl);
                      setEditImageObjectUrl(null);
                      setEditImageUrl("");
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
