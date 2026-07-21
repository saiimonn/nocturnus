import Link from "next/link"
import type { Event, Club } from "@/lib/types"
import { formatEventDate } from "@/lib/utils"

interface EventCardProps {
  event: Event
  status: string
  venue: Club | null
}

export default function EventCard({ event, status, venue }: EventCardProps) {

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#111111] transition-transform duration-300 hover:-translate-y-0.5">
      <div className="relative aspect-video w-full overflow-hidden bg-black/50">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-sm font-medium text-white md:text-base">
            {event.title}
          </h3>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${
              status === "TONIGHT" ? "text-yellow-500" : "text-pink-400"
            }`}
          >
            {status}
          </p>
        </div>

        {venue && (
          <p className="mt-1.5 text-[11px] font-medium tracking-wide text-gray-500">
            {venue.name} · {venue.address}
          </p>
        )}
        <p className="mt-1 text-[11px] text-gray-500 mb-5">
          {formatEventDate(event.event_date)}
        </p>

        <div className="mt-auto">
          <Link href={`/events/${event.id}`}>
            <button className="flex w-full items-center justify-center rounded-full bg-[#1a1a1a] py-3 text-[9px] cursor-pointer font-bold uppercase tracking-widest text-gray-200 transition-colors hover:bg-[#252525]">
              VIEW DETAILS
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
