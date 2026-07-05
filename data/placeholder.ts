export interface Venue {
  id: number
  slug: string
  name: string
  location: string
  type: "Nightclub" | "Speakeasy" | "Lounge" | "Rooftop"
  imageSrc: string
  heroImageSrc: string
  badge?: string
  availability: "available" | "almost-full"
  tablesAvailable?: number
  tags: string[]
  description: string
  capacity: string
  music: string
  entry: string
  hours: string
  gallery: string[]
}

export const venues: Venue[] = [
  {
    id: 1,
    slug: "trademark",
    name: "Trademark",
    location: "Mabolo",
    type: "Nightclub",
    imageSrc: "/venues/trademark.jpg",
    heroImageSrc: "/venues/trademark-hero.jpg",
    badge: "SPECIAL EVENT",
    availability: "available",
    tablesAvailable: 4,
    tags: ["Nightclub", "VIP Tables", "Dress Code"],
    description:
      "Trademark sets the standard for Cebu's mainstream nightlife scene. Expect a packed dance floor, big-name resident DJs, and a sound system built for bass. Tables move fast on weekends.",
    capacity: "500 PAX",
    music: "EDM / HIP-HOP",
    entry: "COVER CHARGE",
    hours: "22:00 - 04:00",
    gallery: [
      "/venues/trademark-1.jpg",
      "/venues/trademark-2.jpg",
      "/venues/trademark-3.jpg",
    ],
  },
  {
    id: 2,
    slug: "icon",
    name: "Icon",
    location: "IT Park",
    type: "Nightclub",
    imageSrc: "/venues/icon.jpg",
    heroImageSrc: "/venues/icon-hero.jpg",
    availability: "almost-full",
    tags: ["Nightclub", "Late Night"],
    description:
      "Icon is IT Park's late-night anchor, known for its rotating lineup of guest DJs and a crowd that shows up after midnight and stays until close.",
    capacity: "400 PAX",
    music: "TECHNO / HOUSE",
    entry: "GUESTLIST ONLY",
    hours: "23:00 - 05:00",
    gallery: ["/venues/icon-1.jpg", "/venues/icon-2.jpg", "/venues/icon-3.jpg"],
  },
  {
    id: 3,
    slug: "sentral",
    name: "Sentral",
    location: "Mandaue",
    type: "Lounge",
    imageSrc: "/venues/sentral.jpg",
    heroImageSrc: "/venues/sentral-hero.jpg",
    availability: "available",
    tablesAvailable: 8,
    tags: ["Lounge", "Live Band"],
    description:
      "Sentral trades strobe lights for warm ambiance. A live band lounge with a curated whisky list, built for conversation as much as the music.",
    capacity: "250 PAX",
    music: "LIVE BAND / JAZZ",
    entry: "OPEN ENTRY",
    hours: "18:00 - 02:00",
    gallery: [
      "/venues/sentral-1.jpg",
      "/venues/sentral-2.jpg",
      "/venues/sentral-3.jpg",
    ],
  },
  {
    id: 4,
    slug: "curfew",
    name: "Curfew",
    location: "Cebu City",
    type: "Speakeasy",
    imageSrc: "/venues/curfew.jpg",
    heroImageSrc: "/venues/curfew-hero.jpg",
    availability: "available",
    tablesAvailable: 2,
    tags: ["Speakeasy", "Open Late", "Strict Dress Code"],
    description:
      "Curfew represents the zenith of Cebu's late-night culture. A brutally minimalist architectural marvel disguised as a high-fidelity sonic sanctuary. Strict door policies ensure an uncompromising crowd, while the state-of-the-art void acoustics system delivers unparalleled clarity.",
    capacity: "800 PAX",
    music: "TECHNO / HOUSE",
    entry: "GUESTLIST ONLY",
    hours: "22:00 - 05:00",
    gallery: [
      "/venues/curfew-1.jpg",
      "/venues/curfew-2.jpg",
      "/venues/curfew-3.jpg",
    ],
  },
  {
    id: 5,
    slug: "verified",
    name: "Verified",
    location: "Banilad",
    type: "Rooftop",
    imageSrc: "/venues/verified.jpg",
    heroImageSrc: "/venues/verified-hero.jpg",
    badge: "LIVE DJ SET",
    availability: "almost-full",
    tags: ["Rooftop", "Live DJ Set", "City View"],
    description:
      "Verified sits above Banilad with an unobstructed skyline view. Weekly live DJ sets pair with an open-air layout that keeps the energy up without the heat of an indoor floor.",
    capacity: "300 PAX",
    music: "AFROBEATS / HOUSE",
    entry: "COVER CHARGE",
    hours: "20:00 - 03:00",
    gallery: [
      "/venues/verified-1.jpg",
      "/venues/verified-2.jpg",
      "/venues/verified-3.jpg",
    ],
  },
  {
    id: 6,
    slug: "the-social",
    name: "The Social",
    location: "Ayala Center",
    type: "Lounge",
    imageSrc: "/venues/thesocial.jpg",
    heroImageSrc: "/venues/thesocial-hero.jpg",
    availability: "available",
    tags: ["Lounge", "Open Entry"],
    description:
      "The Social is Ayala Center's go-to for after-work drinks that turn into a full night out. Approachable, easygoing, and consistently full without ever feeling closed off.",
    capacity: "350 PAX",
    music: "TOP 40 / R&B",
    entry: "OPEN ENTRY",
    hours: "17:00 - 02:00",
    gallery: [
      "/venues/thesocial-1.jpg",
      "/venues/thesocial-2.jpg",
      "/venues/thesocial-3.jpg",
    ],
  },
]

export function getVenueBySlug(slug: string) {
  return venues.find((venue) => venue.slug === slug)
}