export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        Insert: {
          id?: string
          full_name: string
          email: string
          contact_number?: string | null
          password_hash: string
          role: "owner" | "admin"
          status?: "active" | "suspended"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          contact_number?: string | null
          password_hash?: string
          role?: "owner" | "admin"
          status?: "active" | "suspended"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      owner_verification_tokens: {
        Row: {
          id: string
          token_hash: string
          expires_at: string
          used: boolean
          revoked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          token_hash: string
          expires_at: string
          used?: boolean
          revoked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          token_hash?: string
          expires_at?: string
          used?: boolean
          revoked?: boolean
          created_at?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          address: string
          operating_hours: { day: string; open: string; close: string }[] | null
          cover_image_url: string | null
          status: "active" | "inactive"
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
          status?: "active" | "inactive"
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
          status?: "active" | "inactive"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_images: {
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
        Relationships: []
      }
      floor_plans: {
        Row: {
          id: string
          club_id: string
          name: string
          image_url: string
          labels: { text: string; x: number; y: number }[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          name: string
          image_url: string
          labels?: { text: string; x: number; y: number }[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          name?: string
          image_url?: string
          labels?: { text: string; x: number; y: number }[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_tables: {
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
        Relationships: []
      }
      events: {
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
        Relationships: []
      }
      discount_codes: {
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
        Relationships: []
      }
      reservations: {
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
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
