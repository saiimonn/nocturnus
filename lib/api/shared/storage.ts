import { supabaseAdmin } from "@/lib/supabase-admin"
import { badRequest } from "./errors"

const CLUB_MEDIA_BUCKET = "club-media"
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

// Must match the `club-media` bucket's allowed_mime_types in Supabase, or
// uploads pass this check and then fail with an opaque error from Storage.
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

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
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw badRequest(`${field} must be a PNG, JPEG, WEBP, or GIF image`)
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

// Uploads raw bytes under `${pathPrefix}/${uuid}.${extension}` and returns the
// bucket's public URL. Used for server-generated media (e.g. a reservation QR
// PNG) that never arrives as a multipart File.
export async function uploadClubMediaBytes(
  pathPrefix: string,
  bytes: Buffer | Uint8Array,
  contentType: string,
  extension: string,
): Promise<string> {
  const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabaseAdmin.storage
    .from(CLUB_MEDIA_BUCKET)
    .upload(path, bytes, { contentType })
  if (error) {
    throw new Error(error.message)
  }
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(CLUB_MEDIA_BUCKET).getPublicUrl(path)
  return publicUrl
}

// Uploads under `${pathPrefix}/${uuid}.<ext>` and returns the bucket's public
// URL. Callers pass a prefix that scopes the file to its owning record (e.g.
// `clubs/{clubId}/gallery`) — the random suffix just avoids collisions within
// that prefix, it isn't itself a meaningful identifier.
export async function uploadClubMedia(pathPrefix: string, file: File): Promise<string> {
  const extension = file.name.includes(".") ? file.name.split(".").pop()! : "bin"
  const bytes = new Uint8Array(await file.arrayBuffer())
  return uploadClubMediaBytes(pathPrefix, bytes, file.type, extension)
}
