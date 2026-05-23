export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          slug: string
          phone: string | null
          logo_url: string | null
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          phone?: string | null
          logo_url?: string | null
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          phone?: string | null
          logo_url?: string | null
          owner_id?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          phone: string
          whatsapp_confirmed: boolean
          points_balance: number
          total_visits: number
          total_spent: number
          birthday: string | null
          last_visit_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          phone: string
          whatsapp_confirmed?: boolean
          points_balance?: number
          total_visits?: number
          total_spent?: number
          birthday?: string | null
          last_visit_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          phone?: string
          whatsapp_confirmed?: boolean
          points_balance?: number
          total_visits?: number
          total_spent?: number
          birthday?: string | null
          last_visit_at?: string | null
          created_at?: string
        }
      }
      visits: {
        Row: {
          id: string
          client_id: string
          restaurant_id: string
          amount_paid: number
          points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          restaurant_id: string
          amount_paid: number
          points_earned: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          restaurant_id?: string
          amount_paid?: number
          points_earned?: number
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          points_required: number
          discount_percent: number
          expires_in_days: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          points_required: number
          discount_percent: number
          expires_in_days?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          points_required?: number
          discount_percent?: number
          expires_in_days?: number
          is_active?: boolean
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          message: string
          segment: 'all' | 'vip' | 'inactive' | 'new'
          trigger_type: 'birthday' | 'inactive' | 'welcome' | 'manual' | 'points_milestone'
          trigger_value: string | null
          status: 'draft' | 'active' | 'paused' | 'completed'
          sent_count: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          message: string
          segment?: 'all' | 'vip' | 'inactive' | 'new'
          trigger_type: 'birthday' | 'inactive' | 'welcome' | 'manual' | 'points_milestone'
          trigger_value?: string | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          sent_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          message?: string
          segment?: 'all' | 'vip' | 'inactive' | 'new'
          trigger_type?: 'birthday' | 'inactive' | 'welcome' | 'manual' | 'points_milestone'
          trigger_value?: string | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          sent_count?: number
          created_at?: string
        }
      }
      campaign_logs: {
        Row: {
          id: string
          campaign_id: string
          client_id: string
          sent_at: string
          status: 'sent' | 'delivered' | 'failed'
        }
        Insert: {
          id?: string
          campaign_id: string
          client_id: string
          sent_at?: string
          status?: 'sent' | 'delivered' | 'failed'
        }
        Update: {
          id?: string
          campaign_id?: string
          client_id?: string
          sent_at?: string
          status?: 'sent' | 'delivered' | 'failed'
        }
      }
      points_rules: {
        Row: {
          id: string
          restaurant_id: string
          points_per_100mad: number
          welcome_bonus: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          points_per_100mad?: number
          welcome_bonus?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          points_per_100mad?: number
          welcome_bonus?: number
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      campaign_trigger_type: 'birthday' | 'inactive' | 'welcome' | 'manual' | 'points_milestone'
      campaign_status: 'draft' | 'active' | 'paused' | 'completed'
      client_segment: 'all' | 'vip' | 'inactive' | 'new'
      message_status: 'sent' | 'delivered' | 'failed'
    }
  }
}

// Types pratiques dérivés
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Visit = Database['public']['Tables']['visits']['Row']
export type Reward = Database['public']['Tables']['rewards']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignLog = Database['public']['Tables']['campaign_logs']['Row']
export type PointsRule = Database['public']['Tables']['points_rules']['Row']

export type ClientSegment = 'all' | 'vip' | 'inactive' | 'new'

// Segment calculé côté application
export type ClientWithSegment = Client & {
  segment: 'vip' | 'inactive' | 'new' | 'regular'
}
