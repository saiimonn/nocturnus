'use client'

import ClubCard from "./components/card_component"
import { Menu, Filter, Map } from "lucide-react"

export default function Search() {
  return (
    <div className="flex flex-col px-8 py-6 max-w-360 mx-auto w-full">
      <div className="grid grid-cols-[minmax(75px,1fr)_minmax(auto,4fr)_minmax(auto,1fr)] items-center gap-24">
        <h1 className="text-2xl font-bold">Nocturnus</h1>

        <div className="flex h-12 bg-[#111111] border border-[#2a2a2a] rounded-full p-4 text-sm focus:outline-none focus:border-[#444] transition-all">
        </div>

        <div className="flex justify-self-end h-12 bg-[#111111] border border-[#2a2a2a] rounded-full px-6 text-sm items-center justify-center">
          <Menu className = "size-3.5 mr-2" />
          <p>Menu</p>
        </div>
      </div>

      <div className="flex flex-col w-full m-auto pt-10 space-y-6">
        <div className="flex flex-row w-full justify-end items-center">
          
          <div className="flex items-center gap-4">
            <button className="flex h-9 bg-[#111111] border border-[#2a2a2a] rounded-full px-6 text-sm items-center justify-center hover:border-gray-400 transition-colors">
              <Filter className = "size-3.5 mr-2" />
              Filters
            </button>
            
            <button className="flex h-9 bg-[#111111] border border-[#2a2a2a] rounded-full px-6 text-sm items-center justify-center hover:border-gray-400 transition-colors">
              <Map className = "size-3.5 mr-2" />
              Show map
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          <ClubCard clubName = "club_name" address = "address, cebu city" imageSrcs={["/rizzal.png", "/niners.png", "/image4.jpg"]} />
          <ClubCard clubName = "club_name" address = "address, cebu city" imageSrcs={["/rizzal.png", "/image4.jpg"]} />
          <ClubCard clubName = "club_name" address = "address, cebu city" imageSrcs={["/rizzal.png", "/niners.png"]} />
          <ClubCard clubName = "club_name" address = "address, cebu city" imageSrcs={["/niners.png", "/rizzal.png", "/image4.jpg"]} />
          <ClubCard clubName = "club_name" address = "address, cebu city" imageSrcs={["/niners.png"]} />
        </div>
      </div>
    </div>
  )
}
