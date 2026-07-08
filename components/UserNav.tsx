'use client'

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <header className="relative isolate mx-4 mt-4 flex items-center justify-between overflow-visible rounded-2xl  bg-black/45 bg-linear-to-b from-black to-transparent  px-4 py-4 shadow-lg shadow-black/20 backdrop-blur-md  z-10">
      <Link href="/" className="relative z-10 flex items-center gap-2">
        <div className="flex h-5 w-8 items-center justify-center">
          <Image
            src="/logo.svg"
            height={100}
            width={100}
            alt="logo"
          />
        </div>
        <span className="text-white text-lg font-medium tracking-tight">Otus</span>
      </Link>

      <div className="relative z-10 flex items-center gap-8">
        <nav className="hidden items-center gap-8 text-[10px] font-semibold tracking-wide text-white md:flex md:text-sm">
          <Link href="/browse" className="hover:text-[#a3a3a3] transition-colors">
            BROWSE
          </Link>
          <Link href="/currentEvents" className="hover:text-[#a3a3a3] transition-colors">
            EVENTS
          </Link>
        </nav>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 transition-all duration-200 hover:border-white/20 hover:shadow-md hover:shadow-black/20 ${
              isOpen ? "scale-[0.97]" : "scale-100"
            }`}
          >
            <Menu
              size={14}
              className={`text-white transition-transform duration-200 ${
                isOpen ? "rotate-90" : "rotate-0"
              }`}
            />
          </button>

          <div
            className={`absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-white/10 bg-[#0f0f0f]/95 py-3 shadow-xl shadow-black/30 transition-all duration-200 backdrop-blur-md ${
              isOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            }`}
          >
            {!isLoggedIn ? (
              <div className="px-4 py-2 space-y-2">
                <Link
                  href = "/auth/login"
                  className="block w-full text-left text-sm font-medium text-white hover:text-gray-300 transition-colors"
                >
                  Add Your Club
                </Link>
                <Link
                  href="#"
                  className="block text-sm text-gray-400 hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Help and Support
                </Link>
              </div>
            ) : (
              <div className="px-4 py-2 space-y-2">
                <h3 className="text-sm font-bold text-white mb-1">My Account</h3>
                <Link
                  href="#"
                  className="block text-sm text-gray-400 hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { setIsLoggedIn(false); setIsOpen(false); }}
                  className="block w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
