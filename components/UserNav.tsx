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
    <header className="flex items-center justify-between px-4 py-4 m-4 rounded-xl border border-[#1a1a1a] shadow-lg shadow-gray-950/10">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-5 flex items-center justify-center">
          <Image
            src="/logo.svg"
            height={100}
            width={100}
            alt="logo"
          />
        </div>
        <span className="text-white text-lg font-medium tracking-tight">Otus</span>
      </Link>

      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-8 text-[10px] md:text-sm font-semibold tracking-wide text-white">
          <Link href="/browse" className="hover:text-[#a3a3a3] transition-colors">
            Browse
          </Link>
          <Link href="/events" className="hover:text-[#a3a3a3] transition-colors">
            Events
          </Link>
        </nav>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            className={`flex items-center gap-2 px-4 py-2 border border-[#1a1a1a] rounded-full hover:shadow-md hover:cursor-pointer transition-all duration-200 ${
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
            className={`absolute right-0 mt-2 w-56 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl shadow-xl py-3 z-50 origin-top-right transition-all duration-200 ${
              isOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            }`}
          >
            {!isLoggedIn ? (
              <div className="px-4 py-2 space-y-2">
                <button
                  onClick={() => { setIsLoggedIn(true); setIsOpen(false); }}
                  className="block w-full text-left text-sm font-medium text-white hover:text-gray-300 transition-colors"
                >
                  Add Your Club
                </button>
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
