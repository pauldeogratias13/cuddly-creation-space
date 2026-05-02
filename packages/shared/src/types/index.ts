export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Database Types (based on Supabase schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      public_videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          source_url: string;
          thumbnail_url: string | null;
          duration: number;
          is_active: boolean;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          source_url: string;
          thumbnail_url?: string | null;
          duration?: number;
          is_active?: boolean;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          source_url?: string;
          thumbnail_url?: string | null;
          duration?: number;
          is_active?: boolean;
          user_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_posts: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          likes_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      social_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_threads: {
        Row: {
          id: string;
          title: string | null;
          is_group: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          is_group?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string | null;
          is_group?: boolean;
          created_by?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          content: string;
          message_type: "text" | "image" | "video" | "file";
          file_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          content: string;
          message_type?: "text" | "image" | "video" | "file";
          file_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          user_id?: string;
          content?: string;
          message_type?: "text" | "image" | "video" | "file";
          file_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string;
          type:
            | "follow"
            | "like"
            | "comment"
            | "message"
            | "system"
            | "mention"
            | "chat_message"
            | "post_shared"
            | "profile_view"
            | "video_like"
            | "video_comment"
            | "follow_request";
          title: string;
          message: string;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id: string;
          type:
            | "follow"
            | "like"
            | "comment"
            | "message"
            | "system"
            | "mention"
            | "chat_message"
            | "post_shared"
            | "profile_view"
            | "video_like"
            | "video_comment"
            | "follow_request";
          title?: string;
          message: string;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          actor_id?: string;
          type?:
            | "follow"
            | "like"
            | "comment"
            | "message"
            | "system"
            | "mention"
            | "chat_message"
            | "post_shared"
            | "profile_view"
            | "video_like"
            | "video_comment"
            | "follow_request";
          title?: string;
          message?: string;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_devices: {
        Row: {
          id: string;
          user_id: string;
          device_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_token: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_token?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commerce_orders: {
        Row: {
          id: string;
          user_id: string;
          total_amount: number;
          currency: string;
          status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
          items: Json;
          shipping_address: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_amount: number;
          currency?: string;
          status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
          items?: Json;
          shipping_address?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_amount?: number;
          currency?: string;
          status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
          items?: Json;
          shipping_address?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      commerce_cart: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity: number;
          price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_creator_stats: {
        Args: {
          creator_id: string;
        };
        Returns: {
          followers_count: number;
          following_count: number;
          posts_count: number;
          total_likes: number;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// App Types
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  total_likes?: number;
}

export interface CreatorStats {
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_likes: number;
  total_subscribers?: number;
  active_subscribers?: number;
  total_earnings?: number;
  monthly_earnings?: number;
  total_views?: number;
  reputation_score?: number;
  domain_expertise?: string[];
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  source_url: string;
  thumbnail_url: string | null;
  duration: number;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  social_post?: SocialPost;
}

// ── Social Intent System ────────────────────────────────────────────────────
export type IntentMode = "all" | "learn" | "chill" | "explore" | "create" | "shop";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  options: PollOption[];
  total: number;
  voted_option: string | null;
  ends_at: string | null;
}

export interface CommunitySpace {
  id: string;
  name: string;
  topic: string;
  emoji: string;
  members: number;
  isLive: boolean;
  intent: IntentMode;
}

export interface SocialPost {
  id: string;
  user_id: string;
  text: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  video?: Video;
  comments?: SocialComment[];
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_anonymous?: boolean;
  intent_tag?: IntentMode | null;
  poll?: Poll | null;
  reputation_score?: number | null;
  domain_tag?: string | null;
  fork_depth?: number;
  fork_parent_id?: string | null;
}

export interface SocialComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ChatThread {
  id: string;
  title: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile[];
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  message_type: "text" | "image" | "video" | "file";
  file_url: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type:
    | "follow"
    | "like"
    | "comment"
    | "message"
    | "system"
    | "mention"
    | "chat_message"
    | "post_shared"
    | "profile_view"
    | "video_like"
    | "video_comment"
    | "follow_request";
  title: string;
  message: string;
  data: Json;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface CommerceOrder {
  id: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items: Json;
  shipping_address: Json;
  created_at: string;
  updated_at: string;
}

export interface CommerceCartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

// Creator Monetization Types
export interface CreatorTier {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorSubscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  tier_id: string | null;
  active: boolean;
  auto_renew: boolean;
  current_period_start: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tip {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  message: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface GatedContent {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  content_type: "post" | "video" | "article" | "file";
  content_url: string | null;
  content_text: string | null;
  thumbnail_url: string | null;
  access_level: "subscribers" | "paid" | "custom";
  price: number;
  currency: string;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatorEarning {
  id: string;
  creator_id: string;
  type: "subscription" | "tip" | "gated_content" | "brand_deal";
  amount: number;
  currency: string;
  description: string;
  reference_id: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface CreatorStats {
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_likes: number;
  total_views: number;
  reputation_score: number;
  domain_expertise: string[];
  total_subscribers: number;
  active_subscribers: number;
  total_earnings: number;
  monthly_earnings: number;
}

// UI State Types
export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export interface FeedState {
  posts: SocialPost[];
  videos: Video[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface ChatState {
  threads: ChatThread[];
  currentThread: ChatThread | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  totalCount?: number;
  nextPage?: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  username: string;
  full_name?: string;
}

export interface ProfileFormData {
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
}

export interface VideoFormData {
  title: string;
  description?: string;
  source_url: string;
  thumbnail_url?: string;
  duration?: number;
}

export interface CommentFormData {
  content: string;
}

export interface ChatMessageFormData {
  content: string;
  message_type?: "text" | "image" | "video" | "file";
  file_url?: string;
}

// Navigation Types
export type TabName = "home" | "discover" | "create" | "chat" | "profile";
export type StackName = "main" | "auth" | "chat" | "profile" | "create" | "settings";

// Platform Types
export type Platform = "web" | "ios" | "android";
export type Theme = "light" | "dark" | "system";

// Feature Flags
export interface FeatureFlags {
  push_notifications: boolean;
  camera_access: boolean;
  file_upload: boolean;
  offline_mode: boolean;
  biometric_auth: boolean;
}
