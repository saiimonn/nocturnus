'use client'

import { useState, useMemo } from "react"
import Link from "next/link"
import VenueCard from "./components/venueCard"
import { venues } from "@/lib/mock-data-user"

export default function BrowsePage() {
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      return (
        !search ||
        venue.name.toLowerCase().includes(search.toLowerCase()) ||
        venue.address.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [search])

  return (
    <div className="min-h-screen w-full  px-8 py-12 text-white md:px-16">
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

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search venues..."
          className="mt-6 w-full max-w-md rounded-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/25"
        />
      </div>

      {/* Venue grid */}
      {filteredVenues.length === 0 ? (
        <div className="pt-16 text-sm text-gray-500">
          No venues found{search ? ` for "${search}"` : ""}.
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
