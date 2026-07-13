import Image from "next/image"
import { notFound } from "next/navigation"
import { getVenueBySlug, venues } from "@/lib/mock-data-user"
import VenueBooking from "./components/venueBooking"

export function generateStaticParams() {
  return venues.map((venue) => ({ slug: venue.slug }))
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const venue = getVenueBySlug(slug)

  if (!venue) {
    notFound()
  }

  const formatHours = venue.operating_hours
    ? venue.operating_hours.map((h) => `${h.day}: ${h.open} – ${h.close}`).join("\n")
    : null

  return (
    <div className="min-h-screen w-full bg-black text-white -mt-20 z-0">
      {/* Hero */}
      <div className="relative h-105 w-full overflow-hidden md:h-130">
        {venue.cover_image_url && (
          <Image
            src={venue.cover_image_url}
            alt={venue.name}
            fill
            priority
            className="object-cover select-none"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/10" />

        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 md:px-16">
          <p className="text-[11px] uppercase tracking-widest text-gray-400">
            {venue.address.toUpperCase()}
          </p>
          <h1 className="mt-1 text-3xl font-bold uppercase tracking-tight md:text-4xl">
            {venue.name}
          </h1>
        </div>
      </div>

      {/* Venue details */}
      <div className="px-8 py-16 md:px-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[160px_1fr]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            The Venue
          </h2>

          <div className="max-w-2xl">
            {venue.description && (
              <p className="text-[15px] leading-relaxed text-gray-400">
                {venue.description}
              </p>
            )}

            {formatHours && (
              <div className="mt-8 border-t border-[#1f1f1f] pt-6">
                <p className="text-[11px] uppercase tracking-widest text-gray-500">
                  Operating Hours
                </p>
                <div className="mt-2 space-y-1">
                  {venue.operating_hours!.map((h) => (
                    <div key={h.day} className="flex justify-between text-sm text-gray-300">
                      <span>{h.day}</span>
                      <span>{h.open} – {h.close}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Atmosphere gallery */}
        {venue.images.length > 0 && (
          <div className="mt-16">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
              Atmosphere
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {venue.images.map((img, index) => (
                <div
                  key={img.id}
                  className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-[#111111]"
                >
                  <Image
                    src={img.image_url}
                    alt={img.caption || `${venue.name} atmosphere ${index + 1}`}
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
          venueName={venue.name}
          tables={venue.tables}
          floorplanLabels={venue.floorplan_labels}
          floorplanImageUrl={venue.floorplan_image_url}
        />
      </div>
    </div>
  )
}
