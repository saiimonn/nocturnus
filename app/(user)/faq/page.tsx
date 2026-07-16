'use client'

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const FAQ_ITEMS = [
  {
    question: "What is Otus?",
    answer:
      "Otus is a nightclub table reservation platform for Cebu. You can browse venues, view available tables, and reserve a VIP table or bottle service — all from your phone.",
  },
  {
    question: "How do I make a reservation?",
    answer:
      "Browse venues, pick a table, and submit a reservation request. You'll receive a confirmation with a QR code once the venue accepts your booking. Show the QR code at the door for check-in.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. Guest checkout is fully supported — you can reserve a table without creating an account. Simply provide your name and contact details during checkout.",
  },
  {
    question: "How does check-in work?",
    answer:
      "After your reservation is confirmed, you'll receive a unique QR code. Present it at the venue entrance and the bouncer will scan it to complete your check-in.",
  },
  {
    question: "Can I cancel or modify my reservation?",
    answer:
      "You can request a cancellation before the reservation is confirmed. Once confirmed, contact the venue directly for any changes. Cancellation policies may vary per venue.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "Payment is handled at the venue. Each table has a minimum spend requirement that must be met upon arrival. Accepted payment methods depend on the venue.",
  },
  {
    question: "What is a minimum spend?",
    answer:
      "The minimum spend is the lowest amount you must spend on food and drinks to occupy a reserved table. It is set by the venue and displayed on the table details before you book.",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach us at support@otuscebu.com. For venue-specific issues, contact the venue directly through their listing page.",
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen w-full bg-black px-8 py-12 text-white md:px-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight md:text-5xl">
          Frequently Asked
          <br />
          Questions
        </h1>
        <p className="mt-4 max-w-md text-[13px] uppercase leading-relaxed tracking-wide text-gray-500">
          Everything you need to know about reserving tables, checking in, and
          using the platform.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl divide-y divide-[#1a1a1a] border-t border-[#1a1a1a]">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between py-5 text-left cursor-pointer"
            >
              <span className="text-sm font-semibold tracking-wide">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
                  openIndex === i && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden text-sm leading-relaxed text-gray-400 transition-all duration-200",
                openIndex === i ? "pb-5 max-h-40 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {item.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
