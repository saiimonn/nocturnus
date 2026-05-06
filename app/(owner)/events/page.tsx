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

interface EventDetails {
  title: string;
  event_date: Date;
  banner_image_urls: string[];
  description: string;
  tag: string;
}

const fakeEventDetails: EventDetails[] = [
  {
    title: "The NGHT SHW",
    event_date: new Date("2026-04-26"),
    banner_image_urls: ["/img1.jpg", "/img2.jpg", "/img3.jpg"],
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting.",
    tag: "Headliner",
  },
  {
    title: "Corechella",
    event_date: new Date("2026-05-03"),
    banner_image_urls: ["/img2.jpg", "/img1.jpg"],
    description: "Late-night house grooves with city skyline visuals.",
    tag: "Resident DJ",
  },
  {
    title: "Baseline Friday",
    event_date: new Date("2026-05-10"),
    banner_image_urls: ["/img3.jpg", "/img2.jpg"],
    description: "A deep bass takeover with a premium table offer.",
    tag: "Promo",
  },
];

export default function EventsPage() {
  const [events, setEvents] = useState<EventDetails[]>(fakeEventDetails);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImages, setNewImages] = useState("");
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImageObjectUrls, setNewImageObjectUrls] = useState<string[]>([]);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImages, setEditImages] = useState("");
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editImageObjectUrls, setEditImageObjectUrls] = useState<string[]>([]);
  const [activeEventIndex, setActiveEventIndex] = useState<number | null>(null);
  const [activeCarousel, setActiveCarousel] = useState<Record<number, number>>(
    {},
  );
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleCarouselChange = (
    eventIndex: number,
    direction: "prev" | "next",
  ) => {
    const images = events[eventIndex]?.banner_image_urls ?? [];
    if (images.length <= 1) return;

    setActiveCarousel((prev) => {
      const currentIndex = prev[eventIndex] ?? 0;
      const nextIndex =
        direction === "next"
          ? (currentIndex + 1) % images.length
          : (currentIndex - 1 + images.length) % images.length;
      return { ...prev, [eventIndex]: nextIndex };
    });
  };

  const handleOpenDetails = (index: number) => {
    setActiveEventIndex(index);
    setActiveCarousel((prev) => ({ ...prev, [index]: 0 }));
  };

  const handleDeleteEvent = (index: number) => {
    if (!window.confirm("Delete this event? This action cannot be undone.")) {
      return;
    }
    setEvents((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    if (activeEventIndex === index) {
      setActiveEventIndex(null);
    }
    if (editIndex === index) {
      setIsEditOpen(false);
      setEditIndex(null);
    }
  };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !newDate.trim() || !newDescription.trim()) return;

    const imageUrls = newImages
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const fileUrls = newImageObjectUrls;
    const allImages = [...imageUrls, ...fileUrls].filter(Boolean);

    if (allImages.length === 0) return;

    const nextEvent: EventDetails = {
      title: newTitle.trim(),
      event_date: new Date(`${newDate}T00:00:00`),
      banner_image_urls: allImages,
      description: newDescription.trim(),
      tag: newTag.trim() || "Promo",
    };

    setEvents((prev) => [nextEvent, ...prev]);
    setIsAddOpen(false);
    setNewTitle("");
    setNewDate("");
    setNewTag("");
    setNewDescription("");
    setNewImages("");
    setNewImageFiles([]);
    setNewImageObjectUrls([]);
  };

  const handleOpenEdit = (index: number) => {
    const event = events[index];
    if (!event) return;
    setEditIndex(index);
    setEditTitle(event.title);
    setEditDate(event.event_date.toISOString().slice(0, 10));
    setEditTag(event.tag);
    setEditDescription(event.description);
    setEditImages(event.banner_image_urls.join(", "));
    setEditImageFiles([]);
    setEditImageObjectUrls([]);
    setIsEditOpen(true);
  };

  const handleEditSave = () => {
    if (editIndex === null) return;
    if (!editTitle.trim() || !editDate.trim() || !editDescription.trim())
      return;

    const imageUrls = editImages
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const fileUrls = editImageObjectUrls;
    const allImages = [...imageUrls, ...fileUrls].filter(Boolean);

    if (allImages.length === 0) return;

    setEvents((prev) =>
      prev.map((event, index) =>
        index === editIndex
          ? {
              ...event,
              title: editTitle.trim(),
              event_date: new Date(`${editDate}T00:00:00`),
              banner_image_urls: allImages,
              description: editDescription.trim(),
              tag: editTag.trim() || "Promo",
            }
          : event,
      ),
    );

    setIsEditOpen(false);
    setEditIndex(null);
    setEditTitle("");
    setEditDate("");
    setEditTag("");
    setEditDescription("");
    setEditImages("");
    setEditImageFiles([]);
    setEditImageObjectUrls([]);
  };

  const handleImageFilesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setNewImageFiles((prev) => [...prev, ...files]);
    setNewImageObjectUrls((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    event.target.value = "";
  };

  const handleEditImageFilesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setEditImageFiles((prev) => [...prev, ...files]);
    setEditImageObjectUrls((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    event.target.value = "";
  };

  const handleRemoveNewImage = (index: number, type: "url" | "upload") => {
    if (type === "url") {
      const nextUrls = imageUrls.filter((_, itemIndex) => itemIndex !== index);
      setNewImages(nextUrls.join(", "));
      return;
    }

    const removedUrl = newImageObjectUrls[index];
    if (removedUrl) URL.revokeObjectURL(removedUrl);
    setNewImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setNewImageObjectUrls((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleRemoveEditImage = (index: number, type: "url" | "upload") => {
    if (type === "url") {
      const nextUrls = editImageUrls.filter((_, itemIndex) => itemIndex !== index);
      setEditImages(nextUrls.join(", "));
      return;
    }

    const removedUrl = editImageObjectUrls[index];
    if (removedUrl) URL.revokeObjectURL(removedUrl);
    setEditImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setEditImageObjectUrls((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  useEffect(() => {
    return () => {
      newImageObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImageObjectUrls]);

  useEffect(() => {
    return () => {
      editImageObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [editImageObjectUrls]);

  const imageUrls = newImages
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const hasImages = imageUrls.length > 0 || newImageObjectUrls.length > 0;
  const canSubmitNewEvent =
    newTitle.trim().length > 0 &&
    newDate.trim().length > 0 &&
    newDescription.trim().length > 0 &&
    hasImages;

  const editImageUrls = editImages
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const editHasImages =
    editImageUrls.length > 0 || editImageObjectUrls.length > 0;
  const canSubmitEditEvent =
    editTitle.trim().length > 0 &&
    editDate.trim().length > 0 &&
    editDescription.trim().length > 0 &&
    editHasImages;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background/60 p-6">
        <div>
          <h1 className="text-2xl font-bold">Club Events</h1>
          <p className="text-sm text-muted-foreground">
            Promote upcoming nights, resident DJs, and special promos.
          </p>
        </div>
        <Button
          variant="default"
          className="px-4"
          onClick={() => setIsAddOpen(true)}
        >
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
          {events.map((event, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src={event.banner_image_urls[activeCarousel[index] ?? 0]}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  {formatDate(event.event_date)}
                </div>
                {event.banner_image_urls.length > 1 && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={() => handleCarouselChange(index, "prev")}
                    >
                      ‹
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={() => handleCarouselChange(index, "next")}
                    >
                      ›
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {event.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {event.tag}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetails(index)}
                    >
                      View
                    </Button>
                    <Button size="sm" onClick={() => handleOpenEdit(index)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteEvent(index)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={activeEventIndex !== null}
        onOpenChange={() => setActiveEventIndex(null)}
      >
        <DialogContent>
          {activeEventIndex !== null && (
            <>
              <DialogHeader>
                <DialogTitle>{events[activeEventIndex].title}</DialogTitle>
                <DialogDescription>
                  {formatDate(events[activeEventIndex].event_date)}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid gap-4">
                <div className="relative h-56 w-full overflow-hidden rounded-lg">
                  <Image
                    src={
                      events[activeEventIndex].banner_image_urls[
                        activeCarousel[activeEventIndex] ?? 0
                      ]
                    }
                    alt={events[activeEventIndex].title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 480px"
                  />
                  {events[activeEventIndex].banner_image_urls.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        onClick={() =>
                          handleCarouselChange(activeEventIndex, "prev")
                        }
                      >
                        ‹
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        onClick={() =>
                          handleCarouselChange(activeEventIndex, "next")
                        }
                      >
                        ›
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {events[activeEventIndex].description}
                </p>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {events[activeEventIndex].tag}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(activeEventIndex)}
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
                Tag
              </label>
              <Input
                placeholder="Promo"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Images
              </label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFilesChange}
              />
              <span className="text-xs text-muted-foreground">
                Paste URLs separated by commas or upload images.
              </span>
              {!hasImages && (
                <span className="text-xs text-destructive">
                  Add at least one image.
                </span>
              )}
              {(imageUrls.length > 0 || newImageObjectUrls.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {imageUrls.map((url, index) => (
                    <div
                      key={`url-${index}`}
                      className="relative h-16 w-16 overflow-hidden rounded-md border border-border"
                    >
                      <Image
                        src={url}
                        alt="Preview"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                        onClick={() => handleRemoveNewImage(index, "url")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {newImageObjectUrls.map((url, index) => (
                    <div
                      key={`upload-${index}`}
                      className="relative h-16 w-16 overflow-hidden rounded-md border border-border"
                    >
                      <Image
                        src={url}
                        alt="Upload preview"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                        onClick={() => handleRemoveNewImage(index, "upload")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
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
              disabled={!canSubmitNewEvent}
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
            <DialogDescription>
              Update event details and images.
            </DialogDescription>
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
                Tag
              </label>
              <Input
                placeholder="Promo"
                value={editTag}
                onChange={(event) => setEditTag(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Images
              </label>
              <Input
                placeholder="/img1.jpg, /img2.jpg"
                value={editImages}
                onChange={(event) => setEditImages(event.target.value)}
              />
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditImageFilesChange}
              />
              <span className="text-xs text-muted-foreground">
                Paste URLs separated by commas or upload images.
              </span>
              {!editHasImages && (
                <span className="text-xs text-destructive">
                  Add at least one image.
                </span>
              )}
              {(editImageUrls.length > 0 || editImageObjectUrls.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {editImageUrls.map((url, index) => (
                    <div
                      key={`edit-url-${index}`}
                      className="relative h-16 w-16 overflow-hidden rounded-md border border-border"
                    >
                      <Image
                        src={url}
                        alt="Preview"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                        onClick={() => handleRemoveEditImage(index, "url")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {editImageObjectUrls.map((url, index) => (
                    <div
                      key={`edit-upload-${index}`}
                      className="relative h-16 w-16 overflow-hidden rounded-md border border-border"
                    >
                      <Image
                        src={url}
                        alt="Upload preview"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                        onClick={() => handleRemoveEditImage(index, "upload")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
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
              disabled={!canSubmitEditEvent}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
