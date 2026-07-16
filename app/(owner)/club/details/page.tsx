'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, X } from "lucide-react"
import Image from "next/image"
import type { Club, ClubImage } from "@/lib/types"

export default function ClubDetailsPage() {
  const [club, setClub] = useState<Club | null>(null)
  const [images, setImages] = useState<ClubImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const clubResponse = await fetch("/api/owner/club")
        if (!clubResponse.ok) {
          throw new Error(`Request failed with status ${clubResponse.status}`)
        }
        const { club: ownerClub } = (await clubResponse.json()) as {
          club: Club | null
        }
        if (cancelled) return
        setClub(ownerClub)
        setName(ownerClub?.name ?? "")
        setDescription(ownerClub?.description ?? "")
        setAddress(ownerClub?.address ?? "")

        if (ownerClub) {
          const imagesResponse = await fetch(
            `/api/clubs/${ownerClub.slug}/images`,
          )
          if (!imagesResponse.ok) {
            throw new Error(`Request failed with status ${imagesResponse.status}`)
          }
          const { images: clubImages } = (await imagesResponse.json()) as {
            images: ClubImage[]
          }
          if (!cancelled) setImages(clubImages)
        }
      } catch (error) {
        console.error("Failed to load club:", error)
        if (!cancelled) setLoadError("Failed to load your club. Please try again.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const photosToShow = showAllPhotos ? images : images.slice(0, 4)

  const memberSince = club
    ? new Date(club.created_at).toLocaleDateString("en-PH", {
        month: "long",
        year: "numeric",
      })
    : null

  const handleSave = async () => {
    if (!club) return
    if (name.trim() === "") {
      window.alert("Club name cannot be empty.")
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch(`/api/owner/clubs/${club.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, address }),
      })
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const { club: updated } = (await response.json()) as { club: Club }
      setClub(updated)
      setName(updated.name)
      setDescription(updated.description ?? "")
      setAddress(updated.address)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update club:", error)
      window.alert("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setName(club?.name ?? "")
    setDescription(club?.description ?? "")
    setAddress(club?.address ?? "")
    setNewImageFile(null)
    setIsEditing(false)
  }

  const handleToggleStatus = async () => {
    if (!club) return
    const nextStatus = club.status === "draft" ? "active" : "draft"
    setIsTogglingStatus(true)
    try {
      const response = await fetch(`/api/owner/clubs/${club.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const { club: updated } = (await response.json()) as { club: Club }
      setClub(updated)
    } catch (error) {
      console.error("Failed to update club status:", error)
      window.alert("Failed to update club status. Please try again.")
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleAddImage = async () => {
    if (!club || !newImageFile) return
    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", newImageFile)
      const response = await fetch(`/api/owner/clubs/${club.id}/images`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const { image } = (await response.json()) as { image: ClubImage }
      setImages((prev) => [...prev, image])
      setNewImageFile(null)
    } catch (error) {
      console.error("Failed to add photo:", error)
      window.alert("Failed to add the photo. Please try again.")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = async (imageId: string) => {
    if (!club) return
    try {
      const response = await fetch(
        `/api/owner/clubs/${club.id}/images/${imageId}`,
        { method: "DELETE" },
      )
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      setImages((prev) => prev.filter((p) => p.id !== imageId))
    } catch (error) {
      console.error("Failed to remove photo:", error)
      window.alert("Failed to remove the photo. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-muted-foreground">Loading your club…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-3 p-4 text-center">
        <h3 className="text-xl font-semibold text-foreground">
          Couldn&apos;t load your club
        </h3>
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-3 p-4 text-center">
        <h3 className="text-xl font-semibold text-foreground">
          You haven&apos;t registered a club yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Set up your club to start managing events and reservations.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className="space-y-2">
          {isEditing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-md text-3xl font-semibold"
            />
          ) : (
            <h1 className="text-3xl font-semibold text-foreground">
              {club.name}
            </h1>
          )}
          <p className="text-sm text-muted-foreground">
            Member since {memberSince}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} variant="default" disabled={isSaving}>
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {club.status !== "inactive" && (
                <Button
                  onClick={handleToggleStatus}
                  variant="outline"
                  disabled={isTogglingStatus}
                >
                  {club.status === "draft" ? "Publish club" : "Move to draft"}
                </Button>
              )}
              <Button onClick={() => setIsEditing(true)} className="px-4">
                <Edit />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-2 py-4">
        <h3 className="text-xl font-semibold">Description</h3>
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            rows={4}
          />
        ) : (
          <p>{description || "No description yet."}</p>
        )}
      </div>

      <div className="flex flex-col space-y-2 py-4">
        <h3 className="text-xl font-semibold">Address</h3>
        {isEditing ? (
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="max-w-md"
          />
        ) : (
          <p>{address}</p>
        )}
      </div>

      <div className="flex flex-col space-y-2 py-4">
        <h3 className="text-xl font-semibold">Photos</h3>
        <div className="flex flex-col gap-3">
          {isEditing && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)}
                className="max-w-md"
              />
              <Button
                type="button"
                onClick={handleAddImage}
                variant="outline"
                disabled={!newImageFile || isUploadingImage}
              >
                {isUploadingImage ? "Uploading…" : "Add photo"}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {photosToShow.map((img) => (
              <div key={img.id} className="relative aspect-square w-full">
                <Image
                  src={img.image_url}
                  alt={img.caption ?? "Club photo"}
                  fill
                  unoptimized
                  className="object-cover rounded-lg border border-neutral-200"
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute right-1 top-1 rounded-full bg-neutral-900/80 p-1 text-white"
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {images.length > 4 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {showAllPhotos ? images.length : 4} of {images.length}
              </span>
              <button
                type="button"
                onClick={() => setShowAllPhotos((prev) => !prev)}
                className="text-foreground hover:text-violet-500"
              >
                {showAllPhotos
                  ? "See less"
                  : `See more (${images.length - 4})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
