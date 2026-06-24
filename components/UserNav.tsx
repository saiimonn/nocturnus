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
    <div className = "relative z-500 flex justify-between items-center px-16 py-8">
      <div className = "flex gap-4 items-center">
        <Image
          src="/logo.svg"
          alt="logo"
          height={70}
          width={70}
        />
        <button className="text-white bg-purple-500 border border-purple-600 rounded-lg px-4 py-2">
            {/*onClick={() => {}}*/}
            Your favorites
        </button>
      </div>

      <div className="flex gap-2">
        {!isLoggedIn && (
          <>
            <button
              onClick={() => setIsLoggedIn(true)}
              className = "text-sm font-semibold hover:text-gray-600 transition"
            >
              Log in
            </button>
          </>
        )}
        <div ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            <div className={
              `flex gap-2 items-center px-4 py-2 border border-neutral-400 rounded-full hover:shadow-md transition-transform duration-200 ${
                isOpen ? "scale-[0.98]" : "scale-100"
              }`
            }>
              <h1 className = "text-sm font-semibold">Menu</h1>
              <Menu
                size={16}
                className={
                  `transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`
                }
              />
            </div>
          </button>
  
          <div
            className={
              `absolute right-2 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-neutral-100 py-4 z-50 origin-top-right transition-all duration-200 ${
                isOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`
            }
          >
            {!isLoggedIn ? (
              <>
                <div className = "px-5 py-2 text-black">
                  <button
                    onClick={() => { setIsLoggedIn(true); setIsOpen(false); }}
                    className = "block w-full text-left text-sm  font-medium hover:bg-gray-50"
                  >
                    Log in or sign up
                  </button>
  
                  <Link href = "#" className = "block text-sm hover:bg-gray-50">
                    Help and Support
                  </Link>
                </div>
              </>
            ) : (
                <div className="px-5 py-2 text-black">
                  <div>
                      <div>
                        <h3 className = "text-base font-bold">My Account</h3>
                      </div>
    
                      <div className = "mt-2 space-y-1">
                        <Link href = "#" className = "block text-sm hover:bg-gray-50">
                          Dashboard
                        </Link>
    
                        <button
                          onClick={() => { setIsLoggedIn(false); setIsOpen(false) }}
                          className = "block w-full text-left text-sm font-medium hover:bg-gray-50"
                        >
                          Log out
                        </button>
                      </div>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>


    </div>
  )
}
