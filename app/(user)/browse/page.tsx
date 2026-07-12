'use client'

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import VenueCard from "./components/venueCard"
import { venues } from "@/lib/mock-data-user"

export default function BrowsePage() {
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const query = searchParams.get("q")?.trim().toLowerCase() ?? ""

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      return (
        !query ||
        venue.name.toLowerCase().includes(query) ||
        venue.address.toLowerCase().includes(query)
      )
    })
  }, [query])

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

      {/* Venue grid */}
      {filteredVenues.length === 0 ? (
        <div className="pt-16 text-sm text-gray-500">
          No venues found{query ? ` for "${query}"` : ""}.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 ">
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
                address={venue.address}
                cover_image_url={venue.cover_image_url}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
