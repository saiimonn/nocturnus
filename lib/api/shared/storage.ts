import { supabaseAdmin } from "@/lib/supabase-admin"
import { badRequest } from "./errors"

const CLUB_MEDIA_BUCKET = "club-media"
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

// Every club-owned image (gallery photos, cover image, floor plan
// background, event banners) lands in the same public bucket under a
// type-specific path prefix, keyed by the file field on a multipart request.
export async function requireImageFile(
  form: FormData,
  field: string,
): Promise<File> {
  const file = form.get(field)
  if (!(file instanceof File)) {
    throw badRequest(`${field} is required`)
  }
  if (!file.type.startsWith("image/")) {
    throw badRequest(`${field} must be an image`)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw badRequest(`${field} must be smaller than 8MB`)
  }
  return file
}

export async function optionalImageFile(
  form: FormData,
  field: string,
): Promise<File | null> {
  const value = form.get(field)
  if (value === null || (typeof value === "string" && value === "")) {
    return null
  }
  return requireImageFile(form, field)
}

// Uploads under `${pathPrefix}/${uuid}.<ext>` and returns the bucket's public
// URL. Callers pass a prefix that scopes the file to its owning record (e.g.
// `clubs/{clubId}/gallery`) — the random suffix just avoids collisions within
// that prefix, it isn't itself a meaningful identifier.
export async function uploadClubMedia(pathPrefix: string, file: File): Promise<string> {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined
  const path = `${pathPrefix}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`
  const { error } = await supabaseAdmin.storage
    .from(CLUB_MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) {
    throw new Error(error.message)
  }
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(CLUB_MEDIA_BUCKET).getPublicUrl(path)
  return publicUrl
}
