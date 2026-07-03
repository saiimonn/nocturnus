"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import Nav from "@/components/UserNav";
import SearchSuggestionsCard from "@/components/searchSuggestionsCard";

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
    <div className="flex flex-col flex-1 bg-linear-to-b from-black to-[#202020] text-white">
      <Nav />



      <div className = "flex flex-col flex-1 items-center justify-center px-6 -mt-24">
        <h1 className = "text-3xl md:text-4xl font-semibold mb-2 tracking-tight">
          Book local nightclubs in Cebu
        </h1>

        <p className = "text-xs md:text-sm text-[#a3a3a3] mb-8 text-center">
          find your new favorite hangout!
        </p>

        <div className = "relative w-full max-w-3xl items-center">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="flex justify-between items-center w-full h-14 bg-[#111111] border border-[#2a2a2a] rounded-full p-4 text-sm focus-within:border-[#444] transition-all">
                  <Input
                    type="text"
                    name="search"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search clubs..."
                    className="bg-transparent border-none text-white placeholder-[#666666] focus-visible:ring-0"
                  />
                  <button type="submit" className = "h-10 px-6 rounded-full bg-[#e6e6e6] text-black text-sm font-medium hover:bg-white transition-colors">
                    Search
                  </button>
                </div>

                {matchingSuggestions.length > 0 ? (
                   
                    <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#111111] border border-[#2a2a2a] shadow-lg z-10">
                      {matchingSuggestions.map((suggestion) => (
                        
                          /* kabaw ko na lahi ni sa club search chu2, pero static pamn sad to sa /search na part sa site*/
               
                        
                        
                          <SearchSuggestionsCard
                            key={suggestion.label}
                            label={suggestion.label}
                            address={suggestion.address}
                            onSelect={() => setSearchValue(suggestion.label)}
                          />


                      ))}
                    </div>
                ) : null}
              </form>



        </div>



      </div>
    </div>
  );
}
