'use client'

import React from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, ArrowRight, Bookmark } from "lucide-react"
import { getEventById, getVenueByClubId } from "@/lib/mock-data-user"
import { formatEventDate } from "@/lib/utils"

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const currentEvent = getEventById(eventId)
  const venue = currentEvent ? getVenueByClubId(currentEvent.club_id) : null

  if (!currentEvent || !venue) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-zinc-500">Event not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* HERO BANNER */}
      <div className="relative h-[60vh] min-h-[400px] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-lg">
        {currentEvent.image_url && (
          <Image
            src={currentEvent.image_url}
            alt={currentEvent.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* TITLE & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-8">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            {venue.name}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
            {currentEvent.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="bg-white text-black hover:bg-zinc-200 font-bold px-8 rounded-md text-sm"
          >
            BOOK TABLE
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="border-zinc-800 bg-transparent text-white hover:bg-zinc-900 rounded-md"
          >
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212] space-y-5">
            <div className="flex items-start gap-4">
              <Calendar className="w-4 h-4 text-zinc-400 mt-1" />
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Schedule
                </p>
                <p className="text-sm font-semibold text-zinc-200">
                  {formatEventDate(currentEvent.event_date)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212] space-y-4">
            <div className="flex items-start gap-4">
              <MapPin className="w-4 h-4 text-zinc-400 mt-1" />
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Venue
                </p>
                <p className="text-sm font-semibold text-zinc-200">
                  {venue.name}
                </p>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  {venue.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-10">
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-white border-l-2 border-white pl-4">
              THE EVENT
            </h3>
            <p className="text-sm text-zinc-400 leading-loose pr-4">
              {currentEvent.description ||
                `Experience an immersive sonic journey at ${currentEvent.title}. Expect high-voltage energy and an unforgettable night.`}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-white border-l-2 border-white pl-4">
              RESERVE A TABLE
            </h3>

            <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm tracking-wide uppercase text-zinc-100">
                    BOOK AT {venue.name}
                  </h4>
                </div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {venue.address}
                </p>
              </div>

              <div className="flex justify-between items-end mt-6">
                <p className="text-xs text-zinc-400">
                  Select a table from the floor plan to get started.
                </p>
                <Button
                  size="icon"
                  className="bg-white hover:bg-zinc-200 text-black rounded-lg w-10 h-10"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
