'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Maximize2, X, Plus, Minus, RotateCcw } from 'lucide-react'
import type { ClubTable, FloorPlanLabel } from '@/lib/types'

const CANVAS_W = 800
const CANVAS_H = 600

const categoryColors: Record<string, { fill: string; stroke: string; glow: string }> = {
  VIP: { fill: '#7c3aed', stroke: '#a78bfa', glow: 'rgba(124,58,237,0.4)' },
  regular: { fill: '#27272a', stroke: '#71717a', glow: 'rgba(113,113,122,0.3)' },
  booth: { fill: '#0369a1', stroke: '#38bdf8', glow: 'rgba(3,105,161,0.4)' },
  bar: { fill: '#15803d', stroke: '#4ade80', glow: 'rgba(21,128,61,0.4)' },
}

const defaultColors = { fill: '#27272a', stroke: '#71717a', glow: 'rgba(113,113,122,0.3)' }

interface FloorplanViewerProps {
  tables: ClubTable[]
  labels?: FloorPlanLabel[]
  imageUrl?: string
  selectedId?: string | null
  onSelect: (table: ClubTable) => void
}

function FloorplanContent({ tables, labels, imageUrl, selectedId, onSelect }: FloorplanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hoveredTable, setHoveredTable] = useState<ClubTable | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, align: 'center' as 'center' | 'left' | 'right' })

  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 })
  const pinchRef = useRef({ pinching: false, startDist: 0, startScale: 1 })
  const scaleRef = useRef(scale)
  const offsetRef = useRef(offset)
  scaleRef.current = scale
  offsetRef.current = offset

  const getFitScale = useCallback(() => {
    const container = containerRef.current
    if (!container) return 1
    return Math.min(container.clientWidth / CANVAS_W, container.clientHeight / CANVAS_H)
  }, [])

  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    const container = containerRef.current
    if (!container) return { x: ox, y: oy }
    const cw = container.clientWidth
    const ch = container.clientHeight
    const maxX = Math.max(0, (CANVAS_W * s - cw) / 2)
    const maxY = Math.max(0, (CANVAS_H * s - ch) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }, [])

  useEffect(() => {
    const s = getFitScale()
    setScale(s)
    setOffset({ x: 0, y: 0 })
  }, [getFitScale])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const prevent = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault() }
    el.addEventListener('touchmove', prevent, { passive: false })
    return () => el.removeEventListener('touchmove', prevent)
  }, [])

  const zoomIn = useCallback(() => {
    const base = getFitScale()
    const next = Math.min(scaleRef.current * 1.3, 4)
    setScale(next)
    setOffset((o) => clampOffset(o.x, o.y, next))
  }, [getFitScale, clampOffset])

  const zoomOut = useCallback(() => {
    const base = getFitScale()
    const next = Math.max(scaleRef.current / 1.3, base)
    setScale(next)
    setOffset((o) => clampOffset(o.x, o.y, next))
  }, [getFitScale, clampOffset])

  const resetView = useCallback(() => {
    setScale(getFitScale())
    setOffset({ x: 0, y: 0 })
  }, [getFitScale])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch' && e.isPrimary === false) return
    const target = e.target as HTMLElement
    if (target.closest('[data-table]') || target.closest('[data-zoom]')) return
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: offsetRef.current.x, origY: offsetRef.current.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset(clampOffset(dragRef.current.origX + dx, dragRef.current.origY + dy, scaleRef.current))
  }, [clampOffset])

  const handlePointerUp = useCallback(() => {
    dragRef.current.dragging = false
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { pinching: true, startDist: Math.hypot(dx, dy), startScale: scaleRef.current }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current.pinching) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const ratio = Math.hypot(dx, dy) / pinchRef.current.startDist
      const base = getFitScale()
      const next = Math.max(base, Math.min(4, pinchRef.current.startScale * ratio))
      setScale(next)
      setOffset((o) => clampOffset(o.x, o.y, next))
    }
  }, [getFitScale, clampOffset])

  const handleTouchEnd = useCallback(() => {
    pinchRef.current.pinching = false
  }, [])

  const handleMouseEnter = (table: ClubTable, e: React.MouseEvent) => {
    const floorplan = containerRef.current
    if (!floorplan) return
    const containerRect = floorplan.getBoundingClientRect()
    const target = e.currentTarget as HTMLElement
    const targetRect = target.getBoundingClientRect()
    const x = targetRect.left - containerRect.left + targetRect.width / 2
    const tooltipWidth = 208
    const align = x + tooltipWidth / 2 > containerRect.width - 8
      ? 'right'
      : x - tooltipWidth / 2 < 8
        ? 'left'
        : 'center'
    setTooltipPos({ x, y: targetRect.bottom - containerRect.top + 8, align })
    setHoveredTable(table)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden touch-none rounded-xl border border-white/10 bg-[#0a0a0a] h-[80vh] sm:h-[clamp(280px,50vw,500px)]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Floor plan" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : (
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        )}

        {labels?.map((label, i) => (
          <div
            key={i}
            className="absolute select-none text-[11px] font-bold uppercase tracking-[0.2em] text-white/25"
            style={{ left: label.x * CANVAS_W, top: label.y * CANVAS_H, transform: 'translate(-50%, -50%)' }}
          >
            {label.text}
          </div>
        ))}

        {tables.map((table) => {
          const colors = categoryColors[table.category ?? ''] ?? defaultColors
          const isSelected = table.id === selectedId
          const isBar = table.category === 'bar'
          const isUnavailable = !table.is_available

          return (
            <div
              key={table.id}
              data-table
              className={`absolute flex items-center justify-center text-xs font-bold text-white transition-all duration-150 select-none ${
                isBar ? 'rounded-full' : 'rounded-lg'
              } ${isUnavailable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:brightness-125'} ${isSelected ? 'ring-2 ring-white/60' : ''}`}
              style={{
                left: table.pos_x * CANVAS_W,
                top: table.pos_y * CANVAS_H,
                width: isBar ? 56 : 80,
                height: isBar ? 56 : 50,
                transform: 'translate(-50%, -50%)',
                backgroundColor: isSelected ? '#3b82f6' : colors.fill,
                border: `2px solid ${isSelected ? '#60a5fa' : colors.stroke}`,
                boxShadow: isSelected ? `0 0 20px ${colors.glow}` : '0 2px 8px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={(e) => !isUnavailable && handleMouseEnter(table, e)}
              onMouseLeave={() => setHoveredTable(null)}
              onClick={(e) => { e.stopPropagation(); if (!isUnavailable) onSelect(table) }}
            >
              {isUnavailable ? (
                <span className="text-[9px] leading-tight text-white/60">Reserved</span>
              ) : (
                <span className="truncate px-1">{table.label}</span>
              )}
            </div>
          )
        })}
      </div>

      {hoveredTable && (() => {
        const tc = categoryColors[hoveredTable.category ?? ''] ?? defaultColors
        return (
          <div
            className="pointer-events-none absolute z-50 w-52 rounded-lg border border-white/10 bg-black/85 p-3 shadow-xl backdrop-blur-sm"
            style={{
              left: tooltipPos.align === 'right' ? undefined : tooltipPos.x,
              right: tooltipPos.align === 'right' ? 8 : undefined,
              top: tooltipPos.y,
              transform: tooltipPos.align === 'center' ? 'translateX(-50%)' : undefined,
            }}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tc.fill }} />
              <span className="text-sm font-semibold text-white">{hoveredTable.label}</span>
            </div>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Capacity</span>
                <span className="text-white">{hoveredTable.capacity} pax</span>
              </div>
              <div className="flex justify-between">
                <span>Category</span>
                <span className="text-white capitalize">{hoveredTable.category ?? '—'}</span>
              </div>
              {hoveredTable.minimum_spend != null && (
                <div className="flex justify-between">
                  <span>Min. spend</span>
                  <span className="text-white">₱{hoveredTable.minimum_spend.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Status</span>
                <span className={hoveredTable.is_available ? 'text-emerald-400' : 'text-red-400'}>
                  {hoveredTable.is_available ? 'Available' : 'Reserved'}
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      <div data-zoom className="absolute bottom-3 right-3 z-40 flex gap-1.5">
        <button onPointerDown={(e) => e.stopPropagation()} onClick={zoomIn} className="rounded-md border border-white/10 bg-black/60 p-1.5 text-white/50 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={zoomOut} className="rounded-md border border-white/10 bg-black/60 p-1.5 text-white/50 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={resetView} className="rounded-md border border-white/10 bg-black/60 p-1.5 text-white/50 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

interface FloorplanViewerWrapperProps extends FloorplanViewerProps {
  onFullscreen?: () => void
}

export default function FloorplanViewer({ onFullscreen, ...props }: FloorplanViewerWrapperProps) {
  return (
    <div className="relative">
      <FloorplanContent {...props} />
      <button
        onClick={onFullscreen}
        className="absolute right-3 top-3 z-40 rounded-md border border-white/10 bg-black/60 p-2 text-white/50 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 md:hidden"
        >
          <span className="rounded-lg border border-white/20 bg-black/70 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm">
            Tap to view full screen
          </span>
        </button>
      )}
    </div>
  )
}

export function FloorplanFullscreen({
  open,
  onClose,
  ...props
}: FloorplanViewerProps & { open: boolean; onClose: () => void }) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-[101] rounded-md border border-white/10 bg-black/60 p-2 text-white/60 backdrop-blur-sm transition-colors hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className={`relative z-[101] h-[85vh] w-[95vw] max-w-5xl transition-transform duration-300 ease-out ${
          open ? "scale-100" : "scale-95"
        }`}
      >
        <FloorplanContent {...props} />
      </div>
    </div>
  )
}
