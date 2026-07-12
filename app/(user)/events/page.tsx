'use client'

import DateRangeFilter from "@/components/dateRangeFilter"
import EventCard from "@/app/(user)/events/components/userEventCard"
import { useState, useMemo } from "react"
import { events, getVenueByClubId } from "@/lib/mock-data-user"
import { getManilaDayKey } from "@/lib/utils"

function getStatus(dateISO: string) {
  const eventDayKey = getManilaDayKey(dateISO)
  const todayDayKey = getManilaDayKey(new Date())
  const isToday = eventDayKey === todayDayKey
  return isToday ? "TONIGHT" : "UPCOMING"
}

export default function EventListing() {
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" })
  const [search, setSearch] = useState("")

  const publishedEvents = useMemo(
    () => events.filter((e) => e.status === "published"),
    [],
  )

  const filteredEvents = useMemo(() => {
    return publishedEvents.filter((event) => {
      const venue = getVenueByClubId(event.club_id)
      const venueName = venue?.name ?? ""
      const venueAddress = venue?.address ?? ""

      const matchesSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        venueName.toLowerCase().includes(search.toLowerCase()) ||
        venueAddress.toLowerCase().includes(search.toLowerCase())

      const eventDate = new Date(event.event_date)
      const afterStart =
        !dateRange.startDate || eventDate >= new Date(dateRange.startDate)
      const beforeEnd =
        !dateRange.endDate ||
        eventDate <= new Date(`${dateRange.endDate}T23:59:59`)

      return matchesSearch && afterStart && beforeEnd
    })
  }, [publishedEvents, search, dateRange])

  return (
    <div className="min-h-screen w-full bg-black px-8 py-12 text-white md:px-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight md:text-5xl">
          Find Your Night
        </h1>
        <p className="mt-4 max-w-md text-[13px] uppercase leading-relaxed tracking-wide text-gray-500">
          Find the energy that matches your night. Curated selection of the
          finest dance floors and hidden spots.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find the best night around..."
          className="mt-6 w-full max-w-md rounded-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/25"
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
      </div>

      <div className="px-8 pb-16 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mt-8">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            status={getStatus(event.event_date)}
          />
        ))}

        {filteredEvents.length === 0 && (
          <p className="col-span-full text-white/50 text-sm">
            No events found!
          </p>
        )}
      </div>
    </div>
  )
}
