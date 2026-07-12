'use client'

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, X } from "lucide-react"
import Image from "next/image"
import { club, clubImages } from "@/lib/mock-data-owner"

export default function ClubDetailsPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [description, setDescription] = useState(club.description ?? "")
  const [address, setAddress] = useState(club.address)
  const [images, setImages] = useState(clubImages)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const photosToShow = showAllPhotos ? images : images.slice(0, 4)

  const memberSince = new Date(club.created_at).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            {club.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Member since {memberSince}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button onClick={() => setIsEditing(false)} variant="default">
                Save
              </Button>
              <Button
                onClick={() => {
                  setDescription(club.description ?? "")
                  setAddress(club.address)
                  setImages(clubImages)
                  setIsEditing(false)
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="px-4">
              <Edit />
              Edit
            </Button>
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
          <p>{description}</p>
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length === 0) return
                  const newImages = files.map((file, i) => ({
                    id: `ci-new-${Date.now()}-${i}`,
                    club_id: club.id,
                    image_url: URL.createObjectURL(file),
                    caption: null,
                    created_at: new Date().toISOString(),
                  }))
                  setImages((prev) => [...prev, ...newImages])
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Upload photos
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
                    onClick={() =>
                      setImages((prev) =>
                        prev.filter((p) => p.id !== img.id)
                      )
                    }
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
