'use client'
import Image from "next/image"

interface VenueCardProps {
  name: string
  address: string
  cover_image_url?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  className?: string
}

export default function VenueCard({
  name,
  address,
  cover_image_url,
  onMouseEnter,
  onMouseLeave,
  className,
}: VenueCardProps) {
  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#111111] ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/50">
        {cover_image_url && (
          <Image
            src={cover_image_url}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-medium text-white md:text-base">{name}</h3>
          <span className="text-[11px] font-medium tracking-wide text-gray-500">
            {address}
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
