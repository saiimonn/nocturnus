"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import SearchSuggestionsCard from "@/components/searchSuggestionsCard";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GoogleAiChat } from "@/components/googleAiChat";

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

  interface Venue {
    name: string;
    imageSrc: string;
    imageAlt: string;
    location: string;
    tablesLeft: string;
  }

  interface VenueCarouselProps {
    venueCards: Venue[];
    autoPlayInterval?: number;
  }

  const AutoVenueCarousel: React.FC<VenueCarouselProps> = ({ 
    venueCards, 
    autoPlayInterval = 3500 // Defaults to 3.5 seconds
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [visibleCards, setVisibleCards] = useState(1);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    useEffect(() => {
      const updateVisibleCards = () => {
        if (window.innerWidth >= 1280) {
          setVisibleCards(3);
          return;
        }

        if (window.innerWidth >= 768) {
          setVisibleCards(2);
          return;
        }

        setVisibleCards(1);
      };

      updateVisibleCards();
      window.addEventListener("resize", updateVisibleCards);

      return () => window.removeEventListener("resize", updateVisibleCards);
    }, []);

    const maxStartIndex = Math.max(venueCards.length - visibleCards, 0);

    useEffect(() => {
      if (isPaused || maxStartIndex === 0) return;

      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxStartIndex ? 0 : prev + 1));
      }, autoPlayInterval);

      return () => clearInterval(timer);
    }, [isPaused, maxStartIndex, autoPlayInterval]);

    useEffect(() => {
      if (currentIndex > maxStartIndex) {
        setCurrentIndex(0);
      }
    }, [currentIndex, maxStartIndex]);

    const goToNextSlide = () => {
      if (maxStartIndex === 0) return;
      setCurrentIndex((prev) => (prev >= maxStartIndex ? 0 : prev + 1));
    };

    const goToPrevSlide = () => {
      if (maxStartIndex === 0) return;
      setCurrentIndex((prev) => (prev <= 0 ? maxStartIndex : prev - 1));
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
      setIsPaused(true);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || touchEndX.current === null) {
        setIsPaused(false);
        return;
      }

      const swipeDistance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      if (swipeDistance > minSwipeDistance) {
        goToNextSlide();
      } else if (swipeDistance < -minSwipeDistance) {
        goToPrevSlide();
      }

      setIsPaused(false);
    };

    if (!venueCards || venueCards.length === 0) return null;

    return (
      <div
        className="w-full max-w-screen-2xl mx-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={goToPrevSlide}
            disabled={maxStartIndex === 0}
            aria-label="Previous venues"
            className="shrink-0 rounded-full border border-white/15 bg-black/35 p-2.5 text-white/90 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-black/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Slider Track */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
            >
              {venueCards.map((venue, cardIndex) => (
                <div
                  key={`card-${cardIndex}-${venue.name}`}
                  className="w-full shrink-0 px-2 md:w-1/2 xl:w-1/3 hover:scale-90 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative group overflow-hidden rounded-md border border-[#0a0a0a] aspect-4/3 xl:aspect-video">
                    <Image
                      src={venue.imageSrc}
                      alt={venue.imageAlt}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent z-10" />

                    <div className="absolute bottom-4 left-4 z-20 w-full pr-8">
                      <h3 className="text-2xl font-semibold mb-2 tracking-wide text-white">
                        {venue.name}
                      </h3>
                      <div className="flex items-center text-[11px] text-gray-400 gap-3 font-mono">
                        <span className="flex items-center gap-1">
                          <MapIcon className="size-3" />
                          {venue.location}
                        </span>
                        <span className="flex items-center gap-2 border border-[#333] px-2 py-0.5 rounded-sm bg-black/40 text-white">
                          {venue.tablesLeft}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={goToNextSlide}
            disabled={maxStartIndex === 0}
            aria-label="Next venues"
            className="shrink-0 rounded-full border border-white/15 bg-black/35 p-2.5 text-white/90 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-black/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxStartIndex + 1 }).map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const venueCards: Venue[] = [
    {
      name: "ICON",
      imageSrc: "/Image.png",
      imageAlt: "ICON venue",
      location: "Mabolo",
      tablesLeft: "4 Tables Left",
    },
    {
      name: "OASIS",
      imageSrc: "/image4.jpg",
      imageAlt: "OASIS venue",
      location: "Panagdait",
      tablesLeft: "2 Tables Left",
    },
    {
      name: "OASIS",
      imageSrc: "/image4.jpg",
      imageAlt: "OASIS venue",
      location: "Panagdait",
      tablesLeft: "2 Tables Left",
    },
    {
      name: "OASIS",
      imageSrc: "/image4.jpg",
      imageAlt: "OASIS venue",
      location: "Panagdait",
      tablesLeft: "2 Tables Left",
    },
  ];

  

  return (
    <div className="flex-1 flex flex-col">
      <main className = "flex flex-col items-center w-full px-6 md:px-12 lg:px-24 pb-20 flex-1 select-none">
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
          <AutoVenueCarousel venueCards={venueCards} />
        </section>

        <Separator className="max-w-6xl mx-auto mb-24 bg-[#1a1a1a]" />

       
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
              <div className="w-16 h-16 rounded-full border border-[#444] bg-[#050505] flex items-center justify-center mb-6 text-xs font-mono text-gray-300">
                02
              </div>
              <h4 className="text-sm tracking-wider font-semibold mb-3">MASTER THE FLOOR</h4>
              <p className="text-xs text-[#888] leading-relaxed max-w-[220px]">
                View the real-time floor plan and select your preferred table or VIP booth.
              </p>
            </div>
  
            <div className="flex flex-col items-center w-full md:w-1/3 px-4">
              <div className="w-16 h-16 rounded-full border border-[#444] bg-[#050505] flex items-center justify-center mb-6 text-xs font-mono text-gray-300">
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
