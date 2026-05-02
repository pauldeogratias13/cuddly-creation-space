// Canonical copy — keep in sync with apps/web/src/hooks/use-content-creator.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface CreatorProfile {
  id: string; username: string; full_name: string; avatar_url: string; bio: string;
  followers_count: number; following_count: number; posts_count: number;
  is_following: boolean; created_at: string;
}
export interface CreatorPost {
  id: string; user_id: string; video_id: string; title: string; description: string;
  thumbnail_url: string; video_url: string; likes_count: number; comments_count: number;
  shares_count: number; views_count: number; is_liked: boolean; created_at: string;
  username?: string; avatar_url?: string;
}
export interface FollowRelationship {
  id: string; follower_id: string; following_id: string; created_at: string;
  username?: string; avatar_url?: string; full_name?: string;
}
type ProfileRelation = { username?: string | null; avatar_url?: string | null; full_name?: string | null };
type AbortNamedError = { name?: string };

export function useContentCreator() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(false);

  const createPost = useCallback(async (data: { title: string; description: string; video_url: string; thumbnail_url?: string; source_url?: string }) => {
    if (!user) { toast.error("Sign in to create content"); return null; }
    setIsCreating(true);
    try {
      const { data: post, error: postErr } = await supabase.from("social_posts").insert({ user_id: user.id, text: `video:${data.video_url}`, likes_count: 0 }).select("id").single();
      if (postErr) throw postErr;
      const { data: video, error: videoErr } = await supabase.from("public_videos").insert({ title: data.title, description: data.description, author: user.user_metadata?.full_name || user.email, provider: "user-generated", source_url: data.video_url, page_url: data.source_url || data.video_url, poster_url: data.thumbnail_url || null, kind: data.video_url.includes("youtube") ? "youtube" : "native", category: "User Generated", is_active: true, user_id: user.id }).select("id").single();
      if (videoErr) throw videoErr;
      const newPost: CreatorPost = { id: post.id, user_id: user.id, video_id: video.id, title: data.title, description: data.description, thumbnail_url: data.thumbnail_url || "", video_url: data.video_url, likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0, is_liked: false, created_at: new Date().toISOString(), username: user.user_metadata?.username || user.email, avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture };
      setPosts(prev => [newPost, ...prev]);
      toast.success("Content created successfully!");
      return newPost;
    } catch (error) { console.error("[create-post] error:", error); toast.error("Failed to create content"); return null; }
    finally { setIsCreating(false); }
  }, [user]);

  const getUserPosts = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("public_videos").select("id,title,description,poster_url,source_url,created_at,user_id,author,provider").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false });
      if (error) throw error;
      const postsWithCounts = await Promise.all((data || []).map(async (video) => {
        const { data: post } = await supabase.from("social_posts").select("id, likes_count").eq("text", `video:${video.source_url}`).single();
        const { count } = await supabase.from("social_comments").select("*", { count: "exact", head: true }).eq("post_id", post?.id);
        let is_liked = false;
        if (user) { const { data: like } = await supabase.from("social_post_likes").select("post_id").eq("post_id", post?.id).eq("user_id", user.id).maybeSingle(); is_liked = !!like; }
        return { id: post?.id || video.id, user_id: video.user_id, video_id: video.id, title: video.title, description: video.description || "", thumbnail_url: video.poster_url || "", video_url: video.source_url, likes_count: post?.likes_count || 0, comments_count: count || 0, shares_count: 0, views_count: 0, is_liked, created_at: video.created_at, username: video.author, avatar_url: null } as CreatorPost;
      }));
      setPosts(postsWithCounts);
    } catch (error) { console.error("[get-user-posts] error:", error); }
    finally { setLoading(false); }
  }, [user]);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user) { toast.error("Sign in to follow creators"); return false; }
    if (targetUserId === user.id) { toast.error("You can't follow yourself"); return false; }
    try {
      const { data: existing } = await supabase.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).single();
      if (existing) { const { error } = await supabase.from("user_follows").delete().eq("id", existing.id); if (error) throw error; toast.success("Unfollowed creator"); return false; }
      else { const { error } = await supabase.from("user_follows").insert({ follower_id: user.id, following_id: targetUserId }); if (error) throw error; toast.success("Following creator!"); return true; }
    } catch (error) { console.error("[toggle-follow] error:", error); toast.error("Failed to update follow status"); return false; }
  }, [user]);

  const getProfile = useCallback(async (userId: string): Promise<CreatorProfile | null> => {
    try {
      const { data: profile } = await supabase.from("profiles").select("id, username, full_name, avatar_url, bio, created_at").eq("id", userId).single();
      if (!profile) return null;
      const { count: followersCount } = await supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", userId);
      const { count: followingCount } = await supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId);
      const { count: postsCount } = await supabase.from("public_videos").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_active", true);
      let isFollowing = false;
      if (user) { const { data: follow } = await supabase.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", userId).maybeSingle(); isFollowing = !!follow; }
      return { id: profile.id, username: profile.username || "", full_name: profile.full_name || "", avatar_url: profile.avatar_url || "", bio: profile.bio || "", followers_count: followersCount || 0, following_count: followingCount || 0, posts_count: postsCount || 0, is_following: isFollowing, created_at: profile.created_at };
    } catch (error) { console.error("[get-profile] error:", error); return null; }
  }, [user]);

  const getFollowers = useCallback(async (userId: string): Promise<FollowRelationship[]> => {
    try {
      const { data } = await supabase.from("user_follows").select("id,follower_id,created_at,profiles:follower_id(id,username,full_name,avatar_url)").eq("following_id", userId);
      return (data || []).map(item => { const p = item.profiles as ProfileRelation | null; return { id: item.id, follower_id: item.follower_id, following_id: userId, created_at: item.created_at, username: p?.username ?? undefined, avatar_url: p?.avatar_url ?? undefined, full_name: p?.full_name ?? undefined }; });
    } catch (error) { console.error("[get-followers] error:", error); return []; }
  }, []);

  const getFollowing = useCallback(async (userId: string): Promise<FollowRelationship[]> => {
    try {
      const { data } = await supabase.from("user_follows").select("id,following_id,created_at,profiles:following_id(id,username,full_name,avatar_url)").eq("follower_id", userId);
      return (data || []).map(item => { const p = item.profiles as ProfileRelation | null; return { id: item.id, follower_id: userId, following_id: item.following_id, created_at: item.created_at, username: p?.username ?? undefined, avatar_url: p?.avatar_url ?? undefined, full_name: p?.full_name ?? undefined }; });
    } catch (error) { console.error("[get-following] error:", error); return []; }
  }, []);

  const shareContent = useCallback(async (videoId: string, videoTitle: string) => {
    const shareUrl = `${window.location.origin}/video/${videoId}`;
    if (navigator.share) {
      try { await navigator.share({ title: videoTitle, text: `Check out this video: ${videoTitle}`, url: shareUrl }); toast.success("Shared successfully!"); }
      catch (error) { if ((error as AbortNamedError).name !== "AbortError") { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied to clipboard!"); } }
    } else { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied to clipboard!"); }
    try { await supabase.rpc("increment_share_count", { video_id: videoId }); } catch { /* ignore */ }
  }, []);

  return useMemo(() => ({ posts, isCreating, loading, createPost, getUserPosts, toggleFollow, getProfile, getFollowers, getFollowing, shareContent }), [posts, isCreating, loading, createPost, getUserPosts, toggleFollow, getProfile, getFollowers, getFollowing, shareContent]);
}
