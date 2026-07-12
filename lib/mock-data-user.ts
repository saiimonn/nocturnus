export interface ClubImage {
  id: string
  image_url: string
  caption?: string
}

export interface OperatingHours {
  day: string
  open: string
  close: string
}

export interface Venue {
  id: string
  slug: string
  name: string
  description?: string
  address: string
  operating_hours?: OperatingHours[]
  cover_image_url?: string
  images: ClubImage[]
}

export const venues: Venue[] = [
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    slug: "trademark",
    name: "Trademark",
    description:
      "Trademark sets the standard for Cebu's mainstream nightlife scene. Expect a packed dance floor, big-name resident DJs, and a sound system built for bass. Tables move fast on weekends.",
    address: "Mabolo, Cebu City",
    cover_image_url: "/venues/trademark-hero.jpg",
    operating_hours: [
      { day: "Thursday", open: "22:00", close: "04:00" },
      { day: "Friday", open: "22:00", close: "04:00" },
      { day: "Saturday", open: "22:00", close: "04:00" },
    ],
    images: [
      { id: "img-1", image_url: "/venues/trademark-1.jpg", caption: "Main dance floor" },
      { id: "img-2", image_url: "/venues/trademark-2.jpg", caption: "VIP section" },
      { id: "img-3", image_url: "/venues/trademark-3.jpg", caption: "Bar area" },
    ],
  },
  {
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    slug: "icon",
    name: "Icon",
    description:
      "Icon is IT Park's late-night anchor, known for its rotating lineup of guest DJs and a crowd that shows up after midnight and stays until close.",
    address: "IT Park, Cebu City",
    cover_image_url: "/venues/icon-hero.jpg",
    operating_hours: [
      { day: "Friday", open: "23:00", close: "05:00" },
      { day: "Saturday", open: "23:00", close: "05:00" },
    ],
    images: [
      { id: "img-4", image_url: "/venues/icon-1.jpg", caption: "DJ booth" },
      { id: "img-5", image_url: "/venues/icon-2.jpg", caption: "Interior" },
      { id: "img-6", image_url: "/venues/icon-3.jpg", caption: "Entrance" },
    ],
  },
  {
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    slug: "sentral",
    name: "Sentral",
    description:
      "Sentral trades strobe lights for warm ambiance. A live band lounge with a curated whisky list, built for conversation as much as the music.",
    address: "Mandaue City",
    cover_image_url: "/venues/sentral-hero.jpg",
    operating_hours: [
      { day: "Monday", open: "18:00", close: "02:00" },
      { day: "Tuesday", open: "18:00", close: "02:00" },
      { day: "Wednesday", open: "18:00", close: "02:00" },
      { day: "Thursday", open: "18:00", close: "02:00" },
      { day: "Friday", open: "18:00", close: "02:00" },
      { day: "Saturday", open: "18:00", close: "02:00" },
    ],
    images: [
      { id: "img-7", image_url: "/venues/sentral-1.jpg", caption: "Live stage" },
      { id: "img-8", image_url: "/venues/sentral-2.jpg", caption: "Whisky bar" },
      { id: "img-9", image_url: "/venues/sentral-3.jpg", caption: "Lounge seating" },
    ],
  },
  {
    id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80",
    slug: "curfew",
    name: "Curfew",
    description:
      "Curfew represents the zenith of Cebu's late-night culture. A brutally minimalist architectural marvel disguised as a high-fidelity sonic sanctuary. Strict door policies ensure an uncompromising crowd, while the state-of-the-art void acoustics system delivers unparalleled clarity.",
    address: "Cebu City",
    cover_image_url: "/venues/curfew-hero.jpg",
    operating_hours: [
      { day: "Friday", open: "22:00", close: "05:00" },
      { day: "Saturday", open: "22:00", close: "05:00" },
    ],
    images: [
      { id: "img-10", image_url: "/venues/curfew-1.jpg", caption: "Main room" },
      { id: "img-11", image_url: "/venues/curfew-2.jpg", caption: "Sound system" },
      { id: "img-12", image_url: "/venues/curfew-3.jpg", caption: "Lounge" },
    ],
  },
  {
    id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091",
    slug: "verified",
    name: "Verified",
    description:
      "Verified sits above Banilad with an unobstructed skyline view. Weekly live DJ sets pair with an open-air layout that keeps the energy up without the heat of an indoor floor.",
    address: "Banilad, Cebu City",
    cover_image_url: "/venues/verified-hero.jpg",
    operating_hours: [
      { day: "Thursday", open: "20:00", close: "03:00" },
      { day: "Friday", open: "20:00", close: "03:00" },
      { day: "Saturday", open: "20:00", close: "03:00" },
    ],
    images: [
      { id: "img-13", image_url: "/venues/verified-1.jpg", caption: "Rooftop view" },
      { id: "img-14", image_url: "/venues/verified-2.jpg", caption: "DJ setup" },
      { id: "img-15", image_url: "/venues/verified-3.jpg", caption: "Seating area" },
    ],
  },
  {
    id: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102",
    slug: "the-social",
    name: "The Social",
    description:
      "The Social is Ayala Center's go-to for after-work drinks that turn into a full night out. Approachable, easygoing, and consistently full without ever feeling closed off.",
    address: "Ayala Center, Cebu City",
    cover_image_url: "/venues/thesocial-hero.jpg",
    operating_hours: [
      { day: "Monday", open: "17:00", close: "02:00" },
      { day: "Tuesday", open: "17:00", close: "02:00" },
      { day: "Wednesday", open: "17:00", close: "02:00" },
      { day: "Thursday", open: "17:00", close: "02:00" },
      { day: "Friday", open: "17:00", close: "02:00" },
      { day: "Saturday", open: "17:00", close: "02:00" },
    ],
    images: [
      { id: "img-16", image_url: "/venues/thesocial-1.jpg", caption: "Bar counter" },
      { id: "img-17", image_url: "/venues/thesocial-2.jpg", caption: "Main area" },
      { id: "img-18", image_url: "/venues/thesocial-3.jpg", caption: "Outdoor seating" },
    ],
  },
]

export function getVenueBySlug(slug: string) {
  return venues.find((venue) => venue.slug === slug)
}
