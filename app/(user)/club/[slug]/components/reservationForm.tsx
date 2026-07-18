'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ClubTable } from '@/lib/types'

export interface ReservationSubmitResult {
  ok: boolean
  message: string
}

interface ReservationFormProps {
  selectedTable: ClubTable | null
  venueName: string
  onSubmit: (data: {
    name: string
    email: string
    phone: string
    partySize: number
    date: string
    tableId: string
  }) => Promise<ReservationSubmitResult>
}

const categoryAccent: Record<string, string> = {
  VIP: '#7c3aed',
  regular: '#52525b',
  booth: '#0369a1',
  bar: '#15803d',
}

export default function ReservationForm({ selectedTable, venueName, onSubmit }: ReservationFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState('')
  const [date, setDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Tagged with the table it belongs to, so a result from the previous table
  // doesn't linger over a new selection — cheaper than resetting on change.
  const [feedback, setFeedback] = useState<(ReservationSubmitResult & { tableId: string }) | null>(
    null,
  )
  const visibleFeedback = feedback?.tableId === selectedTable?.id ? feedback : null

  const canSubmit =
    !isSubmitting && name.trim() && email.trim() && phone.trim() && partySize && date && selectedTable

  const handleSubmit = async () => {
    if (!canSubmit || !selectedTable) return
    setIsSubmitting(true)
    setFeedback(null)
    try {
      const result = await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        partySize: Number(partySize),
        date,
        tableId: selectedTable.id,
      })
      setFeedback({ ...result, tableId: selectedTable.id })
      // Only clear on success — a failed request should leave the guest's
      // details in place so they can retry without retyping everything.
      if (result.ok) {
        setName('')
        setEmail('')
        setPhone('')
        setPartySize('')
        setDate('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="sticky top-24 rounded-xl border border-[#1a1a1a] bg-[#111111] p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
        Reservation Details
      </h3>

      {!selectedTable ? (
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <svg className="h-5 w-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Click a table on the map to begin</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div
            className="rounded-lg border p-3"
            style={{
              borderColor: categoryAccent[selectedTable.category ?? ''] ?? '#52525b',
              backgroundColor: `${categoryAccent[selectedTable.category ?? ''] ?? '#52525b'}15`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{selectedTable.label}</span>
              <span className="text-xs capitalize text-gray-400">{selectedTable.category ?? 'Table'}</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
              <span>{selectedTable.capacity} pax</span>
              {selectedTable.minimum_spend != null && (
                <span>Min. ₱{selectedTable.minimum_spend.toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="border-[#222] bg-[#0a0a0a] text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@email.com"
                className="border-[#222] bg-[#0a0a0a] text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Phone</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
                className="border-[#222] bg-[#0a0a0a] text-white placeholder:text-gray-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Party Size</label>
                <Input
                  type="number"
                  min={1}
                  max={selectedTable.capacity}
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  placeholder="2"
                  className="border-[#222] bg-[#0a0a0a] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border-[#222] bg-[#0a0a0a] text-white placeholder:text-gray-600"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            {isSubmitting ? 'Sending…' : 'Reserve Now'}
          </Button>

          {visibleFeedback && (
            <p
              role="status"
              className={`text-center text-xs ${visibleFeedback.ok ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {visibleFeedback.message}
            </p>
          )}

          <p className="text-center text-[10px] text-gray-600">
            {venueName} &middot; Guest checkout &middot; No account required
          </p>
        </div>
      )}
    </div>
  )
}
