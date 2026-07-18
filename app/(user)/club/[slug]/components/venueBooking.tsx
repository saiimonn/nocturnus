'use client'

import { useState, useCallback } from 'react'
import FloorplanViewer, { FloorplanFullscreen } from './floorplanViewer'
import ReservationForm, { type ReservationSubmitResult } from './reservationForm'
import type { ClubTable, FloorPlanLabel } from '@/lib/types'

interface VenueBookingProps {
  clubId: string
  venueName: string
  tables?: ClubTable[]
  floorplanLabels?: FloorPlanLabel[]
  floorplanImageUrl?: string
}

export default function VenueBooking({
  clubId,
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

  const handleSubmit = useCallback(async (data: {
    name: string
    email: string
    phone: string
    partySize: number
    date: string
    tableId: string
  }): Promise<ReservationSubmitResult> => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: clubId,
          table_id: data.tableId,
          // reservation_date is a timestamptz, but the form only collects a
          // day. Pin it to UTC midnight so every viewer resolves it to the
          // date the guest actually picked.
          reservation_date: `${data.date}T00:00:00Z`,
          guest_name: data.name,
          guest_email: data.email,
          guest_contact: data.phone,
          party_size: data.partySize,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        return {
          ok: false,
          message: payload?.message ?? 'Could not submit your request. Please try again.',
        }
      }

      // The table stays selected on purpose: the form renders its success
      // message in the selected-table panel, which would unmount if we cleared
      // the selection here.
      return { ok: true, message: 'Request sent — the venue will confirm by email.' }
    } catch {
      return { ok: false, message: 'Network error. Please check your connection and try again.' }
    }
  }, [clubId])

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
