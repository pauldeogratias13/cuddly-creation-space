import { createClient } from "@supabase/supabase-js";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "../types";
import type { Json } from "../types";

type DatabaseRecord = Record<string, Json>;
type DatabaseChangePayload = RealtimePostgresChangesPayload<DatabaseRecord>;

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const createSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: "public",
    },
  });
};

export const supabase = createSupabaseClient();

// Auth helpers
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const updateProfile = async (
  userId: string,
  updates: Partial<Database["public"]["Tables"]["profiles"]["Update"]>,
) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) throw error;
  return data;
};

export const getCreatorStats = async (creatorId: string) => {
  const { data, error } = await supabase.rpc("get_creator_stats", { creator_id: creatorId });

  if (error) throw error;
  return data;
};

// Social functions
export const getSocialPosts = async (limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from("social_posts")
    .select(
      `
      *,
      profile:profiles(*),
      video:public_videos(*)
    `,
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

export const likePost = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from("social_post_likes")
    .insert({ post_id: postId, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const unlikePost = async (postId: string, userId: string) => {
  const { error } = await supabase
    .from("social_post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) throw error;
};

export const getComments = async (postId: string) => {
  const { data, error } = await supabase
    .from("social_comments")
    .select(
      `
      *,
      profile:profiles(*)
    `,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

export const addComment = async (postId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from("social_comments")
    .insert({ post_id: postId, user_id: userId, content })
    .select(
      `
      *,
      profile:profiles(*)
    `,
    )
    .single();

  if (error) throw error;
  return data;
};

// Follow functions
export const followUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from("user_follows")
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) throw error;
};

export const getFollowers = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_follows")
    .select(
      `
      follower_id,
      profile:profiles!user_follows_follower_id_fkey(*)
    `,
    )
    .eq("following_id", userId);

  if (error) throw error;
  return data;
};

export const getFollowing = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_follows")
    .select(
      `
      following_id,
      profile:profiles!user_follows_following_id_fkey(*)
    `,
    )
    .eq("follower_id", userId);

  if (error) throw error;
  return data;
};

// Video functions
export const getVideos = async (limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from("public_videos")
    .select(
      `
      *,
      profile:profiles(*),
      social_post:social_posts(*)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

export const uploadVideo = async (
  videoData: Database["public"]["Tables"]["public_videos"]["Insert"],
) => {
  const { data, error } = await supabase.from("public_videos").insert(videoData).select().single();

  if (error) throw error;
  return data;
};

// Chat functions
export const getChatThreads = async (userId: string) => {
  const { data, error } = await supabase
    .from("chat_threads")
    .select(
      `
      *,
      profiles:profiles(*),
      last_message:chat_messages(*)
    `,
    )
    .or(`created_by.eq.${userId},chat_thread_participants.user_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getChatMessages = async (threadId: string) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      `
      *,
      profile:profiles(*)
    `,
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

export const sendChatMessage = async (
  messageData: Database["public"]["Tables"]["chat_messages"]["Insert"],
) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert(messageData)
    .select(
      `
      *,
      profile:profiles(*)
    `,
    )
    .single();

  if (error) throw error;
  return data;
};

// Notification functions
export const getNotifications = async (userId: string, limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUnreadNotificationCount = async (userId: string) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return data?.length || 0;
};

// Commerce functions
export const getCartItems = async (userId: string) => {
  const { data, error } = await supabase.from("commerce_cart").select("*").eq("user_id", userId);

  if (error) throw error;
  return data;
};

export const addToCart = async (
  itemData: Database["public"]["Tables"]["commerce_cart"]["Insert"],
) => {
  const { data, error } = await supabase.from("commerce_cart").insert(itemData).select().single();

  if (error) throw error;
  return data;
};

export const updateCartItem = async (
  itemId: string,
  updates: Database["public"]["Tables"]["commerce_cart"]["Update"],
) => {
  const { data, error } = await supabase
    .from("commerce_cart")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeFromCart = async (itemId: string) => {
  const { error } = await supabase.from("commerce_cart").delete().eq("id", itemId);

  if (error) throw error;
};

export const createOrder = async (
  orderData: Database["public"]["Tables"]["commerce_orders"]["Insert"],
) => {
  const { data, error } = await supabase
    .from("commerce_orders")
    .insert(orderData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from("commerce_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Real-time subscriptions
export const subscribeToNotifications = (
  userId: string,
  callback: (payload: DatabaseChangePayload) => void,
) => {
  return supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe();
};

export const subscribeToChatMessages = (
  threadId: string,
  callback: (payload: DatabaseChangePayload) => void,
) => {
  return supabase
    .channel("chat_messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${threadId}`,
      },
      callback,
    )
    .subscribe();
};

export const subscribeToPostLikes = (
  postId: string,
  callback: (payload: DatabaseChangePayload) => void,
) => {
  return supabase
    .channel("post_likes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "social_post_likes",
        filter: `post_id=eq.${postId}`,
      },
      callback,
    )
    .subscribe();
};
