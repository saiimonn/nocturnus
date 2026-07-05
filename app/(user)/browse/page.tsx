'use client'

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import VenueCard from "./components/venueCard"
import { venues, type Venue } from "@/data/placeholder"

const VENUE_TYPES = ["All Venues", "Nightclubs", "Speakeasies", "Lounges", "Rooftops"] as const
type VenueTypeFilter = (typeof VENUE_TYPES)[number]

const TYPE_MAP: Record<VenueTypeFilter, Venue["type"] | null> = {
  "All Venues": null,
  Nightclubs: "Nightclub",
  Speakeasies: "Speakeasy",
  Lounges: "Lounge",
  Rooftops: "Rooftop",
}

export default function BrowsePage() {
  const [activeType, setActiveType] = useState<VenueTypeFilter>("All Venues")
  const [activeVenueId, setActiveVenueId] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const query = searchParams.get("q")?.trim().toLowerCase() ?? ""

  const filteredVenues = useMemo(() => {
    const wantedType = TYPE_MAP[activeType]
    return venues.filter((venue) => {
      const matchesType = !wantedType || venue.type === wantedType
      const matchesQuery =
        !query ||
        venue.name.toLowerCase().includes(query) ||
        venue.location.toLowerCase().includes(query)
      return matchesType && matchesQuery
    })
  }, [activeType, query])

  return (
    <div className="min-h-screen w-full bg-black px-8 py-12 text-white md:px-16">
      {/* Hero */}
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight md:text-5xl">
          Explore Cebu&apos;s
          <br />
          Nightlife
        </h1>
        <p className="mt-4 max-w-md text-[13px] uppercase leading-relaxed tracking-wide text-gray-500">
          Raw, immediate, and unfiltered. The pulse of the queen city starts
          here. Curated selection of the finest dance floors and hidden spots.
        </p>
      </div>

      {/* Filter bar */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {VENUE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex h-9 items-center justify-center rounded-full border px-5 text-sm transition-colors ${
                activeType === type
                  ? "border-white bg-white text-black"
                  : "border-[#2a2a2a] bg-transparent text-gray-300 hover:border-gray-400"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button className="flex h-9 items-center gap-2 rounded-full border border-[#2a2a2a] px-5 text-sm text-gray-300 hover:border-gray-400">
            Filter by date
            <ChevronDown className="size-3.5" />
          </button>
          <button className="flex h-9 items-center gap-2 rounded-full border border-[#2a2a2a] px-5 text-sm text-gray-300 hover:border-gray-400">
            Guest count
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Venue grid */}
      {filteredVenues.length === 0 ? (
        <div className="pt-16 text-sm text-gray-500">
          No venues found{query ? ` for "${query}"` : ""}.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVenues.map((venue) => (
            <Link
              key={venue.id}
              href={`/club/${venue.slug}`}
              onMouseEnter={() => setActiveVenueId(venue.id)}
              onMouseLeave={() => setActiveVenueId(null)}
              className={`transition-opacity duration-200 ${
                activeVenueId !== null && activeVenueId !== venue.id
                  ? "opacity-40"
                  : "opacity-100"
              }`}
            >
              <VenueCard
                name={venue.name}
                location={venue.location}
                imageSrc={venue.imageSrc}
                badge={venue.badge}
                availability={venue.availability}
                tablesAvailable={venue.tablesAvailable}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}