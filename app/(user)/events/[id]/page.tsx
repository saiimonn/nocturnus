'use client'

import React from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, ArrowRight, Bookmark } from "lucide-react"
import { getEventById, getVenueByClubId } from "@/lib/mock-data-user"
import { formatEventDate } from "@/lib/utils"


export default function EventDetailPage() {
<<<<<<< HEAD
  const params = useParams();
  
  
  const eventId = Number(params.id);
  const currentEvent = EVENTS.find((e) => e.id === eventId) || EVENTS[0];
=======
  const params = useParams()
  const eventId = params.id as string

  const currentEvent = getEventById(eventId)
  const venue = currentEvent ? getVenueByClubId(currentEvent.club_id) : null

  if (!currentEvent || !venue) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">Event not found.</p>
      </div>
    )
  }
>>>>>>> main

  return (
    <div className="min-h-screen w-full bg-black text-white -mt-20 z-0">
      {/* HERO BANNER */}
      <div className="relative h-105 w-full overflow-hidden md:h-130">
        {currentEvent.image_url && (
          <Image
            src={currentEvent.image_url}
            alt={currentEvent.title}
            fill
            priority
            className="object-cover select-none"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/10" />

        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 md:px-16">
          <p className="text-[11px] uppercase tracking-widest text-gray-400">
            {venue.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold uppercase tracking-tight md:text-4xl">
            {currentEvent.title}
          </h1>
          <div className="mt-4 flex items-center gap-3">
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
      </div>

      {/* CONTENT */}
      <div className="px-8 py-16 md:px-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[160px_1fr]">
          <div className="space-y-4">
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

          <div className="space-y-10">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white border-l-2 border-white pl-4">
                THE EVENT
              </h3>
              <p className="text-[15px] text-gray-400 leading-relaxed">
                {currentEvent.description ||
                  `Experience an immersive sonic journey at ${currentEvent.title}. Expect high-voltage energy and an unforgettable night.`}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white border-l-2 border-white pl-4">
                RESERVE A TABLE
              </h3>

              <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212] flex flex-col justify-between">
                <div className="flex flex-row justify-between">
                  <div className="flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm tracking-wide uppercase text-zinc-100">
                        BOOK AT {venue.name}
                      </h4>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                      {venue.address}
                    </p>
                  <div className="flex justify-between items-end mt-6">
                    <p className="text-xs text-zinc-400">
             1         Select a table from the floor plan to get started.
                    </p>
                  </div>
                  </div>  
                  <div className="flex items-center">
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
      </div>
    </div>
  )
}
