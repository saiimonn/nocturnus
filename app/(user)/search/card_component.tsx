'use client'

import Image from "next/image"
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react"

export default function ClubCard() {
  return (
    <div className="flex h-full w-full flex-col group cursor-pointer font-sans">
      <div className="relative w-full rounded-[14px] bg-white overflow-hidden aspect-[4/3] mb-3">
        <Image
          src="/image4.jpg"
          alt="Club Image"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover w-full h-full"
        />

        <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 z-10 hover:bg-black/30 transition-colors backdrop-blur-sm">
          <button className="flex items-center justify-center">
            <Heart className="w-5 h-5 hover:scale-110 active:scale-95 transition-transform duration-200 stroke-white" />
          </button>
        </div>

        <button className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white shadow-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 text-black">
          <ChevronLeft className = "size-4" />
        </button>

        <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white shadow-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 text-black">
          <ChevronRight className = "size-4" />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between items-start">
          <h1 className="uppercase text-[15px] font-semibold leading-tight">club_name</h1>
          <div className="flex items-center space-x-1 mt-0.5">
            <Star className = "w-3.5 h-3.5" />
            <h3 className="text-[14px] font-semibold leading-none">5.0</h3>
          </div>
        </div>

        <div className="flex space-x-1 text-[14px] mt-0.5">
          <h3>5.6 mi</h3>
          <h3>•</h3>
          <h3 className="truncate">#3 Molave Street, Cebu City</h3>
        </div>

        <div className="flex space-x-1 text-[14px]">
          <h3>Barber</h3>
          <h3>•</h3>
          <h3>638 reviews</h3>
        </div>
      </div>
    </div>
  )
}