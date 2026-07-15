'use client'

import { useState, useCallback } from 'react'
import FloorplanViewer, { FloorplanFullscreen } from './floorplanViewer'
import ReservationForm from './reservationForm'
import type { ClubTable, FloorPlanLabel } from '@/lib/types'

interface VenueBookingProps {
  venueName: string
  tables?: ClubTable[]
  floorplanLabels?: FloorPlanLabel[]
  floorplanImageUrl?: string
}

export default function VenueBooking({
  venueName,
  tables,
  floorplanLabels,
  floorplanImageUrl,
}: VenueBookingProps) {
  const [selectedTable, setSelectedTable] = useState<ClubTable | null>(null)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  const handleSelect = useCallback((table: ClubTable) => {
    setSelectedTable((prev) => (prev?.id === table.id ? null : table))
  }, [])

  const handleSubmit = useCallback((data: {
    name: string
    email: string
    phone: string
    partySize: number
    date: string
    tableId: string
  }) => {
    console.log('Reservation:', {
      ...data,
      venue: venueName,
      table: tables?.find((t) => t.id === data.tableId)?.label,
    })
    alert(`Reservation request submitted for ${tables?.find((t) => t.id === data.tableId)?.label ?? 'table'}! (Demo — no backend)`)
    setSelectedTable(null)
  }, [venueName, tables])

  if (!tables || tables.length === 0) {
    return (
      <div className="mt-16 border-t border-[#1a1a1a] pt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
          Reserve a Table
        </h2>
        <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-[#1a1a1a] bg-[#0a0a0a] py-16 text-center">
          <p className="text-sm text-gray-500">Table reservations coming soon for this venue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16 border-t border-[#1a1a1a] pt-16">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-white">
        Reserve a Table
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <FloorplanViewer
            tables={tables}
            labels={floorplanLabels}
            imageUrl={floorplanImageUrl}
            selectedId={selectedTable?.id}
            onSelect={handleSelect}
            onFullscreen={() => setFullscreenOpen(true)}
          />
        </div>
        <div className="md:col-span-1">
          <ReservationForm
            selectedTable={selectedTable}
            venueName={venueName}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      <FloorplanFullscreen
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        tables={tables}
        labels={floorplanLabels}
        imageUrl={floorplanImageUrl}
        selectedId={selectedTable?.id}
        onSelect={handleSelect}
      />
    </div>
  )
}
