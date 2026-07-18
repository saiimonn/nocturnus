import Image from "next/image"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import VenueBooking from "./components/venueBooking"
import { GoogleAiChat } from "@/components/googleAiChat"
import type { ClubImage, ClubTable } from "@/lib/types"

// The `operating_hours` column stores an array of day/open/close entries.
// (lib/types.ts currently types `Club.operating_hours` as a single object,
// which doesn't match the actual column shape — using the correct array
// shape here rather than that type.)
type OperatingHour = { day: string; open: string; close: string }

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()

  if (clubError) {
    throw new Error(clubError.message)
  }
  if (!club) {
    notFound()
  }

  const [{ data: images, error: imagesError }, { data: floorPlans, error: floorPlansError }] =
    await Promise.all([
      supabase.from("club_images").select("*").eq("club_id", club.id).order("created_at"),
      supabase.from("floor_plans").select("*").eq("club_id", club.id).order("created_at"),
    ])

  if (imagesError) {
    throw new Error(imagesError.message)
  }
  if (floorPlansError) {
    throw new Error(floorPlansError.message)
  }

  // The floor plan viewer only handles one physical layout at a time, so we
  // use the club's first floor plan (if any) for the booking section below.
  const primaryFloorPlan = floorPlans?.[0] ?? null

  const { data: tables, error: tablesError } = primaryFloorPlan
    ? await supabase
        .from("club_tables")
        .select("*")
        .eq("club_id", club.id)
        .eq("floor_plan_id", primaryFloorPlan.id)
        .order("label")
    : { data: [] as ClubTable[], error: null }

  if (tablesError) {
    throw new Error(tablesError.message)
  }

  const operatingHours = club.operating_hours as OperatingHour[] | null
  const clubImages = (images ?? []) as ClubImage[]

  const formatHours = operatingHours
    ? operatingHours.map((h) => `${h.day}: ${h.open} – ${h.close}`).join("\n")
    : null

  return (
    <div className="min-h-screen w-full bg-black text-white -mt-20 z-0">
      {/* Hero */}

      <div className="relative h-105 w-full overflow-hidden md:h-130">
        {club.cover_image_url && (
          <Image
            src={club.cover_image_url}
            alt={club.name}
            fill
            priority
            className="object-cover select-none"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/10" />

        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 md:px-16">
          <p className="text-[11px] uppercase tracking-widest text-gray-400">
            {club.address.toUpperCase()}
          </p>
          <h1 className="mt-1 text-3xl font-bold uppercase tracking-tight md:text-4xl">
            {club.name}
          </h1>
        </div>
      </div>

      {/* Venue details + AI chat */}
      <div className="px-8 py-16 md:px-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[160px_1fr_1fr]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            The Venue
          </h2>

          <div className="max-w-2xl">
            {club.description && (
              <p className="text-[15px] leading-relaxed text-gray-400">
                {club.description}
              </p>
            )}

            {formatHours && (
              <div className="mt-8 border-t border-[#1f1f1f] pt-6">
                <p className="text-[11px] uppercase tracking-widest text-gray-500">
                  Operating Hours
                </p>
                <div className="mt-2 space-y-1">
                  {operatingHours!.map((h) => (
                    <div key={h.day} className="flex justify-between text-sm text-gray-300">
                      <span>{h.day}</span>
                      <span>{h.open} – {h.close}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-full lg:block">
            <GoogleAiChat
              inline
              clubId={club.id}
              description={`Chat with our AI concierge about ${club.name}`}
            />
          </div>
        </div>

        {/* Mobile AI chat */}
        <div className="mt-8 lg:hidden">
          <GoogleAiChat
            inline
            clubId={club.id}
            description={`Chat with our AI concierge about ${club.name}`}
          />
        </div>

        {/* Atmosphere gallery */}
        {clubImages.length > 0 && (
          <div className="mt-16">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
              Atmosphere
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {clubImages.map((img, index) => (
                <div
                  key={img.id}
                  className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-[#111111]"
                >
                  <Image
                    src={img.image_url}
                    alt={img.caption || `${club.name} atmosphere ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-8 pb-16 md:px-16">
        <VenueBooking
          clubId={club.id}
          venueName={club.name}
          tables={tables ?? []}
          floorplanLabels={primaryFloorPlan?.labels ?? undefined}
          floorplanImageUrl={primaryFloorPlan?.image_url ?? undefined}
        />
      </div>
    </div>
  )
}
