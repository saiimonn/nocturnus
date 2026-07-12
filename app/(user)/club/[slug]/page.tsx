import Image from "next/image"
import { notFound } from "next/navigation"
import { getVenueBySlug, venues } from "@/lib/mock-data-user"

export function generateStaticParams() {
  return venues.map((venue) => ({ slug: venue.slug }))
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const venue = getVenueBySlug(slug)

  if (!venue) {
    notFound()
  }

  const stats = [
    { label: "Capacity", value: venue.capacity },
    { label: "Music", value: venue.music },
    { label: "Entry", value: venue.entry },
    { label: "Hours", value: venue.hours },
  ]

  return (
    <div className="min-h-screen w-full bg-black text-white -mt-20 z-0">
      {/* Hero */}
      <div className="relative h-105 w-full overflow-hidden md:h-130">
        <Image
          src={venue.heroImageSrc}
          alt={venue.name}
          fill
          priority
          className="object-cover select-none"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/10" />

        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 md:px-16">
          <p className="text-[11px] uppercase tracking-widest text-gray-400">
            {venue.location.toUpperCase()}
            {venue.type === "Nightclub" ? ", IT PARK" : ""}
          </p>
          <h1 className="mt-1 text-3xl font-bold uppercase tracking-tight md:text-4xl">
            {venue.name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {venue.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#2a2a2a] bg-black/40 px-4 py-1.5 text-xs text-gray-300 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Venue details */}
      <div className="px-8 py-16 md:px-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[160px_1fr]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            The Venue
          </h2>

          <div className="max-w-2xl">
            <p className="text-[15px] leading-relaxed text-gray-400">
              {venue.description}
            </p>

            <div className="mt-8 border-t border-[#1f1f1f] pt-6">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[11px] uppercase tracking-widest text-gray-500">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Atmosphere gallery */}
        <div className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Atmosphere
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {venue.gallery.map((src, index) => (
              <div
                key={src}
                className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-[#111111]"
              >
                <Image
                  src={src}
                  alt={`${venue.name} atmosphere ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}