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
    <header className=" flex items-center justify-between px-4 py-4 m-4 rounded-xl border border-[#1a1a1a] shadow-lg shadow-gray-950/10">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-5 flex items-center justify-center">
          <Image
            src="/logo.svg"
            height={100}
            width={100}
            alt = "logo"
          />
        </div>
        <span className="text-white text-lg font-medium tracking-tight">Otus</span>
      </Link>

      <nav className="flex items-center gap-8 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-white">
        <Link href="/" className="hover:text-[#a3a3a3] transition-colors">
          HOME
        </Link>
        <Link href="/browse" className="hover:text-[#a3a3a3] transition-colors">
          BROWSE
        </Link>
        <Link href="/profile" className="hover:text-[#a3a3a3] transition-colors">
          PROFILE
        </Link>
      </nav>
    </header>
  )
}
