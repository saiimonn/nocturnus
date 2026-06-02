'use client'

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
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
  imageSrc: string
}

interface MapComponentProps {
  clubs: Club[]
  activeClubId: number | null
  onClubSelect: (id: number | null) => void
  center: [number, number]
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

      {clubs.map((club) => (
        <Marker
          key={club.id}
          position={[club.lat, club.lng]}
          icon={createClubIcon(activeClubId === club.id)}
          eventHandlers={{
            click: () => onClubSelect(club.id === activeClubId ? null : club.id),
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'sans-serif', minWidth: '160px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                {club.name}
              </div>

              <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                {club.address}
              </div>

              <div className = "text-[12px]">{club.rating}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}