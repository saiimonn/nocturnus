export interface Database {
  public: {
    Tables: {
      Users: {
        Row: {
          id: string
          full_name: string
          email: string
          contact_number: string | null
          password_hash: string
          role: "guest" | "owner" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          contact_number?: string | null
          password_hash: string
          role: "guest" | "owner" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          contact_number?: string | null
          password_hash?: string
          role?: "guest" | "owner" | "admin"
          created_at?: string
          updated_at?: string
        }
      }
      Owner_Verification_Tokens: {
        Row: {
          id: string
          token_hash: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          token_hash: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          token_hash?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
      Clubs: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          address: string
          operating_hours: { day: string; open: string; close: string }[] | null
          cover_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          address: string
          operating_hours?: { day: string; open: string; close: string }[] | null
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          address?: string
          operating_hours?: { day: string; open: string; close: string }[] | null
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      Club_Images: {
        Row: {
          id: string
          club_id: string
          image_url: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          image_url: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          image_url?: string
          caption?: string | null
          created_at?: string
        }
      }
      Floor_Plans: {
        Row: {
          id: string
          club_id: string
          name: string
          image_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          name: string
          image_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          name?: string
          image_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      Club_Tables: {
        Row: {
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
        Insert: {
          id?: string
          floor_plan_id: string
          club_id: string
          label: string
          capacity: number
          minimum_spend?: number | null
          category?: "VIP" | "regular" | "booth" | "bar" | null
          pos_x: number
          pos_y: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          floor_plan_id?: string
          club_id?: string
          label?: string
          capacity?: number
          minimum_spend?: number | null
          category?: "VIP" | "regular" | "booth" | "bar" | null
          pos_x?: number
          pos_y?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      Events: {
        Row: {
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
        Insert: {
          id?: string
          club_id: string
          title: string
          description?: string | null
          image_url?: string | null
          event_date: string
          status: "draft" | "published" | "cancelled"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          event_date?: string
          status?: "draft" | "published" | "cancelled"
          created_at?: string
          updated_at?: string
        }
      }
      Discount_Codes: {
        Row: {
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
        Insert: {
          id?: string
          club_id: string
          code: string
          discount_type: "percentage" | "fixed_amount"
          discount_value: number
          start_date: string
          end_date: string
          usage_limit: number
          times_used?: number
          is_active?: boolean
          min_order_value: number
        }
        Update: {
          id?: string
          club_id?: string
          code?: string
          discount_type?: "percentage" | "fixed_amount"
          discount_value?: number
          start_date?: string
          end_date?: string
          usage_limit?: number
          times_used?: number
          is_active?: boolean
          min_order_value?: number
        }
      }
      Reservations: {
        Row: {
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
        Insert: {
          id?: string
          table_id: string
          club_id: string
          event_id?: string | null
          reservation_date: string
          guest_name: string
          guest_email: string
          guest_contact?: string | null
          party_size: number
          qr_code_token?: string | null
          status: "pending" | "confirmed" | "cancelled" | "checked_in"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          club_id?: string
          event_id?: string | null
          reservation_date?: string
          guest_name?: string
          guest_email?: string
          guest_contact?: string | null
          party_size?: number
          qr_code_token?: string | null
          status?: "pending" | "confirmed" | "cancelled" | "checked_in"
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
