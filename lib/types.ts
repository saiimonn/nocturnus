export interface User {
  id: string
  full_name: string
  email: string
  contact_number: string | null
  password_hash: string
  role: "owner" | "admin"
  status: "active" | "suspended"
  created_at: string
  updated_at: string
}

export interface Club {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  address: string
  operating_hours: OperatingHours | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
  status: "active" | "inactive"
}

export interface OperatingHours {
  day: string
  open: string
  close: string
}

export interface ClubImage {
  id: string
  club_id: string
  image_url: string
  caption: string | null
  created_at: string
}

export interface FloorPlanLabel {
  text: string
  x: number
  y: number
}

export interface FloorPlan {
  id: string
  club_id: string
  name: string
  image_url: string
  labels: FloorPlanLabel[] | null
  created_at: string
  updated_at: string
}

export interface ClubTable {
  id: string
  floor_plan_id: string
  club_id: string
  label: string
  capacity: number
  minimum_spend: number | null
  category: "VIP" | "regular" | "booth" | "bar" | null
  pos_x: number
  pos_y: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  club_id: string
  title: string
  description: string | null
  image_url: string | null
  event_date: string
  status: "draft" | "published" | "cancelled"
  created_at: string
  updated_at: string
}

export interface DiscountCode {
  id: string
  club_id: string
  code: string
  discount_type: "percentage" | "fixed_amount"
  discount_value: number
  start_date: string
  end_date: string
  usage_limit: number
  times_used: number
  is_active: boolean
  min_order_value: number
}

export interface Reservation {
  id: string
  table_id: string
  club_id: string
  event_id: string | null
  reservation_date: string
  guest_name: string
  guest_email: string
  guest_contact: string | null
  party_size: number
  qr_code_token: string | null
  status: "pending" | "confirmed" | "cancelled" | "checked_in"
  created_at: string
  updated_at: string
}
