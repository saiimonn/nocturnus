import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-linear-to-b from-black to-[#202020] text-white">
      <div className = "relative z-10 flex justify-between items-center p-16">
        <h1 className="text-2xl">NYX</h1>

        <div className = "flex gap-4 items-center">
          <Link href="/" className = "text-sm font-medium hover:text-gray-300 transition-colors">
            Log In
          </Link>
          
          <Button variant ="ghost" className = "rounded-full px-6 py-2 bg-[#e6e6e6] text-black text-sm font-medium hover:bg-white transition-colors">
            Profile
          </Button>
        </div>
      </div>

      <div className = "flex flex-col flex-1 items-center justify-center px-6 -mt-24">
        <h1 className = "text-3xl md:text-4xl font-semibold mb-2 tracking-tight">
          Book local nightclubs in Cebu
        </h1>

        <p className = "text-xs md:text-sm text-[#a3a3a3] mb-8 text-center">
          Lorem Ipsum has been the industrys standard dummy text ever since the 1500s
        </p>

        <div className = "relative w-full max-w-3xl items-center">
          <div className="flex justify-end items-center w-full h-14 bg-[#111111] border border-[#2a2a2a] rounded-full p-4 text-sm focus:outline-none focus:border-[#444] transition-all">
            <button className = "h-10 px-6 rounded-full bg-[#e6e6e6] text-black text-sm font-medium hover:bg-white transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
