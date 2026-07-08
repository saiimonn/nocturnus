"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ArrowRight, Plus, Bookmark } from "lucide-react";

const EVENTS = [
  {
    id: 1,
    name: "OASIS CEBU",
    location: "Luxury Nightlife • Panagdait, Cebu City",
    date: "Tonight, 10:00 PM",
    category: "Live DJ",
  },
  {
    id: 2,
    name: "TRADEMARK",
    location: "Underground • Mabolo, Cebu City",
    date: "Tonight, 11:00 PM",
    category: "Lounge",
  },
  {
    id: 3,
    name: "SENTRAL",
    location: "Rooftop Lounge • IT Park, Cebu",
    date: "Tonight, 9:00 PM",
    category: "Rooftop",
  },
  {
    id: 4,
    name: "ICON",
    location: "Mainroom • Mabolo, Cebu City",
    date: "Tomorrow, 10:00 PM",
    category: "Live DJ",
  },
  {
    id: 5,
    name: "ICON LATE NIGHT",
    location: "Mainroom • Mabolo, Cebu City",
    date: "Tomorrow, 12:30 AM",
    category: "Live DJ",
  },
];

export default function EventDetailPage() {
  const params = useParams();
  
  // 2. Look at the URL (e.g., /events/1), get the ID number, and find that event in the array
  const eventId = Number(params.id);
  const currentEvent = EVENTS.find((e) => e.id === eventId) || EVENTS[0]; // Falls back to first event if id doesn't match

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 max-w-5xl mx-auto space-y-8 font-sans">
      
      {/* HERO BANNER */}
      <div className="relative h-[60vh] min-h-[400px] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-lg">
        <Image
          src="/Image.png" 
          alt={currentEvent.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* TITLE & TICKETS - Now updates dynamically! */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-8">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            {currentEvent.category} Event
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
            {currentEvent.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button size="lg" className="bg-white text-black hover:bg-zinc-200 font-bold px-8 rounded-md text-sm">
            GET TICKETS
          </Button>
          <Button size="icon" variant="outline" className="border-zinc-800 bg-transparent text-white hover:bg-zinc-900 rounded-md">
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212] space-y-5">
            <div className="flex items-start gap-4">
              <Calendar className="w-4 h-4 text-zinc-400 mt-1" />
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Schedule</p>
                <p className="text-sm font-semibold text-zinc-200">{currentEvent.date}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212] space-y-4">
            <div className="flex items-start gap-4">
              <MapPin className="w-4 h-4 text-zinc-400 mt-1" />
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Venue & Area</p>
                <p className="text-sm font-semibold text-zinc-200">{currentEvent.location.split("•")[1] || currentEvent.location}</p>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  {currentEvent.location}
                </p>
              </div>
            </div>
            <div className="w-full h-24 bg-[#0a0a0a] border border-zinc-800 rounded-md mt-4 relative flex items-end justify-end p-2">
                 <span className="text-[10px] text-zinc-500 font-medium">VIEW MAP</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-10">
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-white border-l-2 border-white pl-4">
              THE EVENT
            </h3>
            <p className="text-sm text-zinc-400 leading-loose pr-4">
              Experience an immersive sonic journey at {currentEvent.name}. Expect high-voltage energy, unreleased edits, and a state-of-the-art visual production tailored specifically for this venue. The night promises relentless grooves and an uncompromising atmosphere.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-white border-l-2 border-white pl-4">
              ADMISSION
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212] flex flex-col justify-between h-56">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm tracking-wide uppercase text-zinc-100">GENERAL<br/>ADMISSION</h4>
                    <span className="font-mono text-sm font-bold text-white">₱1,500</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">ENTRY BEFORE 12AM</p>
                </div>
                
                <div className="flex justify-between items-end">
                    <ul className="text-xs text-zinc-400 space-y-2">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-zinc-600"></span> Access to main floor</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-zinc-600"></span> 1 Complimentary Drink</li>
                    </ul>
                    <Button size="icon" className="bg-[#1a1a1a] hover:bg-zinc-800 text-white rounded-lg border border-zinc-800 w-10 h-10">
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212] flex flex-col justify-between h-56">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm tracking-wide uppercase text-zinc-100">SECURE A<br/>TABLE</h4>
                    <span className="text-[11px] text-zinc-400 font-medium">From <span className="text-sm font-bold text-white font-mono ml-1">₱15k</span></span>
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">VIP BOOKING</p>
                </div>
                
                <div className="flex justify-between items-end">
                    <ul className="text-xs text-zinc-400 space-y-2">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-zinc-600"></span> Priority Entry</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-zinc-600"></span> Dedicated Service</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-zinc-600"></span> Consumable Value</li>
                    </ul>
                    <Button size="icon" className="bg-white hover:bg-zinc-200 text-black rounded-lg w-10 h-10">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}