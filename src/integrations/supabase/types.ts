export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          sender: string
          text: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sender: string
          text: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sender?: string
          text?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_thread_reads: {
        Row: {
          last_read_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_thread_reads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      commerce_cart_items: {
        Row: {
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          product_id: string
          product_name: string
          quantity?: number
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commerce_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "commerce_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "commerce_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_orders: {
        Row: {
          created_at: string
          id: string
          status: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string
          currency: string
          description: string | null
          id: string
          processed_at: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id: string
          currency?: string
          description?: string | null
          id?: string
          processed_at?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string
          currency?: string
          description?: string | null
          id?: string
          processed_at?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: []
      }
      creator_subscriptions: {
        Row: {
          active: boolean | null
          auto_renew: boolean | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          creator_id: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          subscriber_id: string
          tier_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          auto_renew?: boolean | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          creator_id: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          subscriber_id: string
          tier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          auto_renew?: boolean | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          creator_id?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          subscriber_id?: string
          tier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_tiers: {
        Row: {
          benefits: Json | null
          created_at: string | null
          creator_id: string
          currency: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          creator_id: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          creator_id?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      gaming_scores: {
        Row: {
          high_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          high_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          high_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gated_content: {
        Row: {
          access_level: string
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          creator_id: string
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          price: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          access_level?: string
          content_text?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          creator_id: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          access_level?: string
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          creator_id?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      nexos_apps: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          handle: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          handle?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          handle?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      public_videos: {
        Row: {
          author: string | null
          category: string
          created_at: string
          description: string | null
          duration_label: string | null
          failure_count: number
          id: string
          is_active: boolean
          kind: string
          last_checked_at: string | null
          page_url: string | null
          poster_url: string | null
          provider: string
          sort_order: number
          source_url: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration_label?: string | null
          failure_count?: number
          id?: string
          is_active?: boolean
          kind?: string
          last_checked_at?: string | null
          page_url?: string | null
          poster_url?: string | null
          provider: string
          sort_order?: number
          source_url: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration_label?: string | null
          failure_count?: number
          id?: string
          is_active?: boolean
          kind?: string
          last_checked_at?: string | null
          page_url?: string | null
          poster_url?: string | null
          provider?: string
          sort_order?: number
          source_url?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      social_comments: {
        Row: {
          created_at: string
          id: string
          post_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          created_at: string
          id: string
          likes_count: number
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          likes_count?: number
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          likes_count?: number
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      tips: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          from_user_id: string
          id: string
          is_anonymous: boolean | null
          message: string | null
          to_user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          from_user_id: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          to_user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          from_user_id?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          to_user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string
          id: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          handle: string | null
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handle?: string | null
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handle?: string | null
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      youtube_sources: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          last_error: string | null
          last_synced_at: string | null
          max_results: number
          value: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          last_error?: string | null
          last_synced_at?: string | null
          max_results?: number
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          last_error?: string | null
          last_synced_at?: string | null
          max_results?: number
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_creator_stats: {
        Args: { creator_id: string }
        Returns: {
          followers_count: number
          following_count: number
          posts_count: number
          total_likes: number
        }[]
      }
      get_creator_subscription_stats: {
        Args: { creator_id: string }
        Returns: {
          active_subscribers: number
          monthly_earnings: number
          total_earnings: number
          total_subscribers: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
