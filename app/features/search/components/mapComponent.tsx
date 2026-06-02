'use client'

import { useMemo, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const createClubIcon = (isActive: boolean) =>
  L.divIcon({
    html: `
      <div style="
        width: 14px;
        height: 14px;
        background: ${isActive ? '#111111' : '#ffffff'};
        border: 2.5px solid #111111;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        cursor: pointer;
        transition: transform 0.15s;
        transform: ${isActive ? 'scale(1.4)' : 'scale(1)'};
      "></div>
    `,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  })

interface Club {
  id: number
  name: string
  address: string
  lat: number
  lng: number
  rating: number
  imageSrcs: string[]
}

interface MapComponentProps {
  clubs: Club[]
  activeClubId: number | null
  onClubSelect: (id: number | null) => void
  center: [number, number]
}

function MapMarkers({ clubs, activeClubId, onClubSelect }: Omit<MapComponentProps, "center">) {
  const map = useMap()
  const [activeIndexes, setActiveIndexes] = useState<Record<number, number>>({})

  const imagesByClub = useMemo(
    () =>
      clubs.reduce<Record<number, string[]>>((acc, club) => {
        acc[club.id] = club.imageSrcs.filter(Boolean)
        return acc
      }, {}),
    [clubs]
  )

  const setIndex = (clubId: number, nextIndex: number) => {
    setActiveIndexes((prev) => ({ ...prev, [clubId]: nextIndex }))
  }

  return (
    <>
      {clubs.map((club) => (
        <Marker
          key={club.id}
          position={[club.lat, club.lng]}
          icon={createClubIcon(activeClubId === club.id)}
          eventHandlers={{
            click: () => {
              if (club.id === activeClubId) {
                onClubSelect(null)
                map.closePopup()
                return
              }

              onClubSelect(club.id)
            },
          }}
        >
          <Popup closeButton={false} className="club-popup">
            <div className="w-[400px] rounded-[14px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] overflow-hidden">
              <div className="relative h-[220px] w-full">
                {(() => {
                  const images = imagesByClub[club.id] ?? []
                  const hasImages = images.length > 0
                  const activeIndex = activeIndexes[club.id] ?? 0
                  const showControls = images.length > 1
                  const activeImage = hasImages ? images[activeIndex] : "/image4.jpg"

                  const goPrev = () =>
                    setIndex(club.id, (activeIndex - 1 + images.length) % images.length)
                  const goNext = () =>
                    setIndex(club.id, (activeIndex + 1) % images.length)

                  return (
                    <>
                      <div
                        className="flex h-full w-full transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                      >
                        {images.map((src, index) => (
                          <div
                            key={`popup-image-${club.id}-${index}`}
                            className="relative h-full w-full shrink-0"
                          >
                            <Image
                              src={src}
                              alt={`${club.name} image ${index + 1}`}
                              fill
                              sizes="260px"
                              className="object-cover"
                              priority={index === 0}
                            />
                          </div>
                        ))}
                        {!hasImages ? (
                          <div className="relative h-full w-full shrink-0">
                            <Image
                              src={activeImage}
                              alt={club.name}
                              fill
                              sizes="260px"
                              className="object-cover"
                            />
                          </div>
                        ) : null}
                      </div>

                      {showControls ? (
                        <>
                          <button
                            type="button"
                            aria-label="Previous image"
                            onClick={goPrev}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-black"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Next image"
                            onClick={goNext}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-black"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </>
                      ) : null}

                      {showControls ? (
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, index) => (
                            <span
                              key={`popup-dot-${club.id}-${index}`}
                              className={`h-1.5 w-1.5 rounded-full ${
                                index === activeIndex ? "bg-white" : "bg-white/60"
                              }`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </>
                  )
                })()}

                <button
                  type="button"
                  aria-label="Close popup"
                  onClick={() => {
                    onClubSelect(null)
                    map.closePopup()
                  }}
                  className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] flex items-center justify-center"
                >
                  <X className="size-3.5 text-black" />
                </button>

                
              </div>

              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[14px] font-semibold uppercase leading-tight text-black">
                    {club.name}
                  </div>
                  <div className="flex items-center gap-1 text-[13px] font-semibold text-black">
                    <span>★</span>
                    <span>{club.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="mt-1 text-[12px] text-gray-500">
                  {club.address} • Cebu City
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default function Map({ clubs, activeClubId, onClubSelect, center }: MapComponentProps) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      className = "h-full w-full"
      zoomControl
    >
      <TileLayer
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapMarkers
        clubs={clubs}
        activeClubId={activeClubId}
        onClubSelect={onClubSelect}
      />
    </MapContainer>
  )
}
