"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import SearchSuggestionsCard from "@/components/searchSuggestionsCard";
import Image from "next/image";
import { MapIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

  const LAST_UPDATED = "July 10, 2026";

  const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using Otus ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.`,
  },
  {
    title: "2. Description of Service",
    body: `Otus is a platform that indexes Cebu-based nightlife venues and events, including club, bar, and event information for discovery purposes. Otus does not own, operate, or manage the venues listed and is not responsible for the accuracy of third-party event details, pricing, or availability.`,
  },
  {
    title: "3. User Accounts",
    body: `Some features may require you to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information and promptly update it if it changes.`,
  },
  {
    title: "4. Acceptable Use",
    body: `You agree not to misuse the Service, including but not limited to: scraping or harvesting data without permission, impersonating any person or entity, uploading harmful or illegal content, or interfering with the Service's normal operation.`,
  },
  {
    title: "5. Event & Venue Listings",
    body: `Event details, schedules, pricing, and venue information are provided by third parties or aggregated from public sources and may change without notice. Otus makes no guarantee as to the accuracy, completeness, or timeliness of this information. Always confirm details directly with the venue before attending.`,
  },
  {
    title: "6. Intellectual Property",
    body: `All content on Otus, including logos, design, and original text, is the property of Otus or its licensors and may not be reproduced, distributed, or used without prior written permission.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `Otus is provided "as is" without warranties of any kind. To the fullest extent permitted by law, Otus and its affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including issues arising at third-party venues or events.`,
  },
  {
    title: "8. Termination",
    body: `We reserve the right to suspend or terminate your access to the Service at our discretion, without notice, for conduct that violates these Terms or is otherwise harmful to other users or the Service.`,
  },
  {
    title: "9. Changes to These Terms",
    body: `We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms. We encourage you to review this page periodically.`,
  },
  {
    title: "10. Governing Law",
    body: `These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines, without regard to its conflict of law provisions.`,
  },
  {
    title: "11. Contact Us",
    body: `If you have questions about these Terms, please reach out at contact@otus.app.`,
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

          <h1 className = "text-4xl md:text-5xl lg:text-6xl font-light  text-gray-200">
            Terms of Service
          </h1>

        </section>

         <p className="text-sm text-gray-500 pb-4">Last updated: {LAST_UPDATED}</p>

        <Separator className="max-w-6xl mx-auto mb-24 bg-[#1a1a1a]" />



        <div className="flex-1 flex flex-col">
          <main className="flex flex-col items-center w-full px-6 md:px-12 lg:px-24 pb-20 flex-1 select-none">
         

              <article className="w-full max-w-3xl mx-auto flex flex-col gap-10">
                {sections.map((section) => (
                  <div key={section.title} className="flex flex-col gap-3">
                    <h2 className="text-xl font-medium text-gray-200">
                      {section.title}
                    </h2>
                    <p className="text-sm md:text-base leading-relaxed text-gray-400">
                      {section.body}
                    </p>
                  </div>
                ))}
              </article>

        <Separator className="max-w-6xl mx-auto mt-24 bg-[#1a1a1a]" />
      </main>
    </div>


      </main>
    </div>
  );
}
