'use client'

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import ClubCard from "./components/cardComponent"
import { Menu, Filter, Map, X } from "lucide-react"
import Link from "next/link"

const MapComponent = dynamic(
  () => import("@/app/features/search/components/mapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#0f0f0f]">
        <div className="text-sm text-gray-400">Loading map…</div>
      </div>
    ),
  }
)

interface Club {
  id: number
  name: string
  address: string
  imageSrcs: string[]
  lat: number
  lng: number
  rating: number
}

const clubs: Club[] = [
  {
    id: 1,
    name: "club_name",
    address: "address, cebu city",
    imageSrcs: ["/rizzal.png", "/niners.png", "/image4.jpg"],
    lat: 10.3157,
    lng: 123.8854,
    rating: 5.0,
  },
  {
    id: 2,
    name: "club_name",
    address: "address, cebu city",
    imageSrcs: ["/rizzal.png", "/image4.jpg"],
    lat: 10.3175,
    lng: 123.891,
    rating: 5.0,
  },
  {
    id: 3,
    name: "club_name",
    address: "address, cebu city",
    imageSrcs: ["/rizzal.png", "/niners.png"],
    lat: 10.312,
    lng: 123.887,
    rating: 5.0,
  },
  {
    id: 4,
    name: "club_name",
    address: "address, cebu city",
    imageSrcs: ["/niners.png", "/rizzal.png", "/image4.jpg"],
    lat: 10.3195,
    lng: 123.883,
    rating: 5.0,
  },
  {
    id: 5,
    name: "club_name",
    address: "address, cebu city",
    imageSrcs: ["/niners.png"],
    lat: 10.314,
    lng: 123.892,
    rating: 5.0,
  },
]

const MAP_CENTER: [number, number] = [10.3157, 123.888]

export default function Search() {
  const [showMap, setShowMap] = useState(true)
  const [activeClubId, setActiveClubId] = useState<number | null>(null)

  const mapClubs = useMemo(
    () =>
      clubs.map((c) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        lat: c.lat,
        lng: c.lng,
        rating: c.rating,
        imageSrcs: c.imageSrcs,
      })),
    []
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0b0b0b] text-white">
      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-6 max-w-360 mx-auto w-full">
        <div className="grid grid-cols-2 items-center gap-24">
          <Link
            href="/"
          >
            <Image
              src="/logo.svg"
              alt="logo"
              height={70}
              width={70}
            />
          </Link>


          {/*<div className="flex h-12 bg-[#111111] border border-[#2a2a2a] rounded-full p-4 text-sm focus:outline-none focus:border-[#444] transition-all" />*/}

          <div className="flex justify-self-end h-12 bg-[#111111] border border-[#2a2a2a] rounded-full px-6 text-sm items-center justify-center text-white">
            <Menu className="size-3.5 mr-2" />
            <p>Menu</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: cards panel */}
        <div
          className={`flex flex-col overflow-y-auto transition-all duration-300 ${
            showMap ? "w-[500px] flex-shrink-0" : "flex-1"
          }`}
        >
          {/* Toolbar */}
          <div className="shrink-0 flex flex-row w-full justify-end items-center px-8 pb-4 gap-4">
            <button className="flex h-9 bg-[#111111] border border-[#2a2a2a] rounded-full px-6 text-sm items-center justify-center hover:border-gray-400 transition-colors text-white">
              <Filter className="size-3.5 mr-2" />
              Filters
            </button>

            <button
              onClick={() => setShowMap((v) => !v)}
              className={`flex h-9 border rounded-full px-6 text-sm items-center justify-center transition-colors ${
                showMap
                  ? "bg-white text-black border-white hover:bg-gray-100"
                  : "bg-[#111111] border-[#2a2a2a] hover:border-gray-400 text-white"
              }`}
            >
              {showMap ? (
                <>
                  <X className="size-3.5 mr-2" />
                  Hide map
                </>
              ) : (
                <>
                  <Map className="size-3.5 mr-2" />
                  Show map
                </>
              )}
            </button>
          </div>

          {/* Cards grid */}
          <div
            className={`px-8 pb-8 grid gap-x-4 gap-y-8 ${
              showMap
                ? "grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {clubs.map((club) => (
              <div
                key={club.id}
                className={`transition-opacity duration-200 ${
                  activeClubId !== null && activeClubId !== club.id
                    ? "opacity-40"
                    : "opacity-100"
                }`}
                onMouseEnter={() => setActiveClubId(club.id)}
                onMouseLeave={() => setActiveClubId(null)}
              >
                <ClubCard
                  clubName={club.name}
                  address={club.address}
                  imageSrcs={club.imageSrcs}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: map panel */}
        {showMap && (
          <div className="flex-1 rounded-2xl overflow-hidden p-4">
            <div className = "h-full w-full rounded-2xl overflow-hidden">
              <MapComponent
                clubs={mapClubs}
                activeClubId={activeClubId}
                onClubSelect={setActiveClubId}
                center={MAP_CENTER}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
