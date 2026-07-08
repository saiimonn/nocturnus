'use client'

import Image from "next/image"

interface VenueCardProps {
  name: string
  location: string
  imageSrc: string
  badge?: string
  availability: "available" | "almost-full"
  tablesAvailable?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  className?: string
}

export default function VenueCard({
  name,
  location,
  imageSrc,
  badge,
  availability,
  tablesAvailable,
  onMouseEnter,
  onMouseLeave,
  className,
}: VenueCardProps) {
  const isAvailable = availability === "available"

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#111111] ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/50">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {badge && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-md">
            <span className="text-[8px] font-semibold uppercase tracking-widest text-white">
              {badge}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-medium text-white md:text-base">{name}</h3>
          <span className="text-[11px] font-medium tracking-wide text-gray-500">
            {location}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="relative flex h-1.5 w-1.5 items-center justify-center">
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                isAvailable ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            {isAvailable && (
              <div className="absolute h-full w-full animate-ping rounded-full bg-emerald-500/80" />
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
            {isAvailable
              ? `${tablesAvailable ?? 0} TABLES AVAILABLE`
              : "ALMOST FULL"}
          </span>
        </div>

        <div className="mt-5">
          <button className="flex w-full items-center justify-center rounded-full bg-[#1a1a1a] py-3 text-[9px] font-bold uppercase tracking-widest text-gray-200 transition-colors hover:bg-[#252525]">
            BOOK NOW
          </button>
        </div>
      </div>
    </div>
  )
}