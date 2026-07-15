'use client'

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import VenueCard from "./components/venueCard"
import type { Club } from "@/lib/types"

type ClubListItem = Pick<
  Club,
  "id" | "name" | "slug" | "description" | "address" | "cover_image_url" | "operating_hours"
>

export default function BrowsePage() {
  const [venues, setVenues] = useState<ClubListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadClubs() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/clubs")
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.message ?? "Unable to load venues.")
        }
        const data = await res.json()
        if (!cancelled) {
          setVenues(data.clubs ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load venues.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadClubs()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      return (
        !search ||
        venue.name.toLowerCase().includes(search.toLowerCase()) ||
        venue.address.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [search, venues])

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
      {loading ? (
        <div className="pt-16 text-sm text-gray-500">Loading venues…</div>
      ) : error ? (
        <div className="pt-16 text-sm text-red-400">{error}</div>
      ) : filteredVenues.length === 0 ? (
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
                cover_image_url={venue.cover_image_url ?? undefined}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
