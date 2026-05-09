'use client'

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Edit, X } from "lucide-react"
import Image from "next/image"

interface ClubDetails {
  name: string;
  description: string;
  location: string;
  pictures: string[];
}

const fakeClubDetails: ClubDetails = {
  name: "Club_Name",
  description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  location: "Club_Address",
  pictures: [
    "/img1.jpg",
    "/img1.jpg",
    "/img1.jpg",
    "/img1.jpg",
    "/img1.jpg",
    "/img1.jpg",
    "/img1.jpg",
    "/img1.jpg",
    "/img1.jpg",
  ]
}

export default function ClubDetailsPage() {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [editableDetails, setEditableDetails] = useState<ClubDetails>(fakeClubDetails);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosToShow = showAllPhotos
    ? editableDetails.pictures
    : editableDetails.pictures.slice(0, 4);

  
  
  return (
    <div className="p-4">
      <div className = "flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className = "space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            {editableDetails.name}
          </h1>
        </div>

        <div className = "flex flex-wrap gap-2">
          <Button
            onClick={() => setIsEditing(true)}
            className = "px-4"
          >
            <Edit />
            Edit
          </Button>
        </div>
      </div>

      <div className = "flex flex-col space-y-2 py-4">
        <h3 className="text-xl font-semibold">Description</h3>
        {isEditing ? (
          <textarea
            value={editableDetails.description}
            onChange={(event) =>
              setEditableDetails(prev => ({
                ...prev,
                description: event.target.value,
              }))
            }
            className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            rows={4}
          />
        ) : (
          <p>{ editableDetails.description }</p>
        )}
      </div>

      <div className = "flex flex-col space-y-2 py-4">
        <h3 className="text-xl font-semibold">Location</h3>
        {isEditing ? (
          <Input
            value={editableDetails.location}
            onChange={(event) =>
              setEditableDetails(prev => ({
                ...prev,
                location: event.target.value,
              }))
            }
            className="max-w-md"
          />
        ) : (
          <p>{ editableDetails.location }</p>
        )}
      </div>

      <div className = "flex flex-col space-y-2 py-4">
        <h3 className="text-xl font-semibold">Photos</h3>

        <div className = "flex flex-col gap-3">
          {isEditing && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files || [])
                  if (files.length === 0) return
                  const newUrls = files.map(file => URL.createObjectURL(file))
                  setEditableDetails(prev => ({
                    ...prev,
                    pictures: [...prev.pictures, ...newUrls],
                  }))
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click()
                }}
                variant="outline"
              >
                Upload photos
              </Button>
            </div>
          )}
          <div className = "grid grid-cols-4 gap-2">
            {photosToShow.map((src, index) => (
              <div key={`${src}-${index}`} className = "relative aspect-square w-full">
                <Image
                  src={src}
                  alt={`Club photo ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover rounded-lg border border-neutral-200"
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditableDetails(prev => ({
                        ...prev,
                        pictures: prev.pictures.filter((_, photoIndex) => photoIndex !== index),
                      }))
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

          {editableDetails.pictures.length > 4 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {showAllPhotos ? editableDetails.pictures.length : 4} of {editableDetails.pictures.length}
              </span>
              <button
                type="button"
                onClick={() => setShowAllPhotos(prev => !prev)}
                className="text-foreground hover:text-violet-500"
              >
                {showAllPhotos ? "See less" : `See more (${editableDetails.pictures.length - 4})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => setIsEditing(false)}
            variant="default"
          >
            Save
          </Button>
          <Button
            onClick={() => {
              setEditableDetails(fakeClubDetails)
              setIsEditing(false)
            }}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
