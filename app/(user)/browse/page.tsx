'use client'

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import VenueCard from "./components/venueCard"

interface Venue {
  id: number
  name: string
  location: string
  imageSrc: string
  badge?: string
  availability: "available" | "almost-full"
  tablesAvailable?: number
}

const venues: Venue[] = [
  {
    id: 1,
    name: "Trademark",
    location: "Mabolo",
    imageSrc: "/Image.png",
    badge: "SPECIAL EVENT",
    availability: "available",
    tablesAvailable: 4,
  },
  {
    id: 2,
    name: "Icon",
    location: "IT Park",
    imageSrc: "/venues/icon.jpg",
    availability: "almost-full",
  },
  {
    id: 3,
    name: "Sentral",
    location: "Mandaue",
    imageSrc: "/venues/sentral.jpg",
    availability: "available",
    tablesAvailable: 8,
  },
  {
    id: 4,
    name: "Curfew",
    location: "Cebu City",
    imageSrc: "/venues/curfew.jpg",
    availability: "available",
    tablesAvailable: 2,
  },
  {
    id: 5,
    name: "Verified",
    location: "Banilad",
    imageSrc: "/venues/verified.jpg",
    badge: "LIVE DJ SET",
    availability: "almost-full",
  },
  {
    id: 6,
    name: "The Social",
    location: "Ayala Center",
    imageSrc: "/venues/thesocial.jpg",
    availability: "available",
  },
]

export default function BrowsePage() {
  const [activeVenueId, setActiveVenueId] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const query = searchParams.get("q")?.trim().toLowerCase() ?? ""

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      const matchesQuery =
        !query ||
        venue.name.toLowerCase().includes(query) ||
        venue.location.toLowerCase().includes(query)
      return matchesQuery
    })
  }, [query])

  return (
    <div className="min-h-screen w-full bg-black px-8 py-12 text-white md:px-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight md:text-5xl">
          Explore Cebu&apos;s
          <br />
          Nightlife
        </h1>
        <p className="mt-4 max-w-md text-[11px] uppercase leading-relaxed tracking-widest text-gray-500">
          Raw, immediate, and unfiltered. The pulse of the queen city starts
          here. Curated selection of the finest dance floors and hidden spots.
        </p>
      </div>

      {filteredVenues.length === 0 ? (
        <div className="pt-16 text-sm text-gray-500">
          No venues found{query ? ` for "${query}"` : ""}.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVenues.map((venue) => (
            <VenueCard
              key={venue.id}
              name={venue.name}
              location={venue.location}
              imageSrc={venue.imageSrc}
              badge={venue.badge}
              availability={venue.availability}
              tablesAvailable={venue.tablesAvailable}
              onMouseEnter={() => setActiveVenueId(venue.id)}
              onMouseLeave={() => setActiveVenueId(null)}
              className={`transition-opacity duration-300 ${
                activeVenueId !== null && activeVenueId !== venue.id
                  ? "opacity-40"
                  : "opacity-100"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}