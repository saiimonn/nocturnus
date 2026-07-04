"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import SearchSuggestionsCard from "@/components/searchSuggestionsCard";
import Image from "next/image";
import { MapIcon } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const suggestions = useMemo(
    () => [
      { label: "CLUB_NAME1", address: "Cebu City" },
      { label: "CLUB_NAME2", address: "Cebu City" },
      { label: "CLUB_NAME3", address: "Cebu City" },
      { label: "CLUB_NAME4", address: "Cebu City" },
      { label: "CLUB_NAME5", address: "Ayala Center" },
      { label: "CLUB_NAME6", address: "IT Park" },
      { label: "CLUB_NAME7", address: "Mango Avenue" },
    ],
    []
  );

  const matchingSuggestions = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return [];
    return suggestions
      .filter(
        (item) =>
          item.label.toLowerCase().includes(normalized) ||
          item.address.toLowerCase().includes(normalized)
      )
      .slice(0, 5);
  }, [searchValue, suggestions]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchValue.trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="bg-[#050505] text-white font-sans flex-1 flex flex-col">
      <main className = "flex flex-col items-center w-full px-6 md:px-12 lg:px-24 pb-20 flex-1">
        <section className = "flex flex-col items-center justify-center mt-24 mb-32 text-center">
          <div className = "mb-6 w-24 h-16">
            <Image
              src="/logo.svg"
              alt = "logo"
              width={100}
              height={100}
            />
          </div>

          <h1 className = "text-4xl md:text-5xl lg:text-6xl font-light mb-4 text-gray-200">
            We Plan, You Just Party
          </h1>

          <p className = "text-[#888888] text-sm md:text-base tracking-[0.2em] uppercase font-medium">
            Plan better with us
          </p>
        </section>

        <section className = "w-full max-w-6xl mb-32">
          <h2 className="text-2xl md:text-3xl font-medium mb-8">TONIGHT&apos;S VENUES</h2>
          <div className = "grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className = "relative group overflow-hidden rounded-md border border-[#0a0a0a] aspect-video">
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent z-10" />
              <div className = "absolute top-4 right-4 z-20 border border-[#333] px-3 py-1 text-[10px] font-mono tracking-wider bg-black/60 rounded-sm text-gray-300">
                10,000 MIN
              </div>

              <div className = "absolute bottom-4 left-4 z-20 w-full pr-8">
                <h3 className="text-2xl font-semibold mb-2 tracking-wide">ICON</h3>
                <div className = "flex items-center text-[11px] text-gray-400 gap-3 font-mono">
                  <span className = "flex items-center gap-1">
                    <MapIcon className="size-3" />
                    Mabolo
                  </span>
                  <span className = "flex items-center gap-2 border border-[#333] px-2 py-0.5 rounded-sm bg-black/40">
                    <span className="size-1.5" />
                    4 Tables Left
                  </span>
                </div>
              </div>
            </div>

            <div className = "relative group overflow-hidden rounded-md border border-[#0a0a0a] aspect-video">
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent z-10" />
              <div className = "absolute top-4 right-4 z-20 border border-[#333] px-3 py-1 text-[10px] font-mono tracking-wider bg-black/60 rounded-sm text-gray-300">
                10,000 MIN
              </div>

              <div className = "absolute bottom-4 left-4 z-20 w-full pr-8">
                <h3 className="text-2xl font-semibold mb-2 tracking-wide">ICON</h3>
                <div className = "flex items-center text-[11px] text-gray-400 gap-3 font-mono">
                  <span className = "flex items-center gap-1">
                    <MapIcon className="size-3" />
                    Mabolo
                  </span>
                  <span className = "flex items-center gap-2 border border-[#333] px-2 py-0.5 rounded-sm bg-black/40">
                    <span className="size-1.5" />
                    4 Tables Left
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className = "w-full max-w-5xl mb-24 relative">
          <h2 className="text-2xl md:text-3xl font-medium mb-16 text-left uppercase">how to book</h2>

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center text-center">
            <div className="hidden md:block absolute top-1/4 left-[15%] right-[15%] border-t border-dashed border-[#222] -z-10"></div>
  
            <div className="flex flex-col items-center w-full md:w-1/3 px-4 mb-10 md:mb-0">
              <div className="w-16 h-16 rounded-full border border-[#444] bg-[#050505] flex items-center justify-center mb-6 text-xs font-mono text-gray-300">
                01
              </div>
              <h4 className="text-sm tracking-wider font-semibold mb-3">CHOOSE YOUR VIBE</h4>
              <p className="text-xs text-[#888] leading-relaxed max-w-[220px]">
                Browse venues and events in Cebu. Find the energy that matches your night.
              </p>
            </div>
  
            <div className="flex flex-col items-center w-full md:w-1/3 px-4 mb-10 md:mb-0">
              <div className="w-16 h-16 border border-[#444] bg-[#050505] flex items-center justify-center mb-6 text-xs font-mono text-gray-300 rotate-45">
                <span className="-rotate-45">02</span>
              </div>
              <h4 className="text-sm tracking-wider font-semibold mb-3">MASTER THE FLOOR</h4>
              <p className="text-xs text-[#888] leading-relaxed max-w-[220px]">
                View the real-time floor plan and select your preferred table or VIP booth.
              </p>
            </div>
  
            <div className="flex flex-col items-center w-full md:w-1/3 px-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 text-xs font-mono text-black font-bold">
                03
              </div>
              <h4 className="text-sm tracking-wider font-semibold mb-3">LOCK IT IN</h4>
              <p className="text-xs text-[#888] leading-relaxed max-w-[220px]">
                Confirm your booking and guest list instantly. No waiting, no friction.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
