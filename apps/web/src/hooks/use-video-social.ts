/**
 * use-video-social.ts
 *
 * Manages likes, comments, and counts for a single video identified by its
 * public_videos.id.  Works correctly for:
 *   - Unauthenticated visitors (read-only counts are shown)
 *   - Authenticated users (like / comment / delete)
 *
 * Design: one `social_posts` row acts as the "social anchor" for each video.
 *   row.text  = `video:${videoId}`   (stable, never changes)
 *   row.likes_count  = canonical like count (kept in sync via DB trigger or
 *                       optimistic update)
 *
 * The anchor row is created lazily the first time an authenticated user
 * interacts with a video, so there is no "create post on mount" side-effect.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────

export type VideoComment = {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
};

type SocialAnchor = {
  id: string;        // social_posts.id
  likes: number;
  liked: boolean;    // whether current user has liked
};

// ── Hook ──────────────────────────────────────────────────────────────────

export function useVideoSocial(videoId: string) {
  const { user } = useAuth();

  const [anchor, setAnchor] = useState<SocialAnchor | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(false);

  // Stable ref so real-time callbacks can access latest anchor without
  // re-subscribing every time it changes.
  const anchorRef = useRef<SocialAnchor | null>(null);
  useEffect(() => { anchorRef.current = anchor; }, [anchor]);

  // ── Load anchor + comments ──────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // 1. Find the anchor post for this video
        const { data: postRows, error: postErr } = await supabase
          .from("social_posts")
          .select("id, likes_count")
          .eq("text", `video:${videoId}`)
          .limit(1);

        if (postErr) throw postErr;
        if (cancelled) return;

        const postRow = postRows?.[0] ?? null;
        const postId = postRow?.id ?? null;

        // 2. Check whether current user has liked (only if logged in and anchor exists)
        let liked = false;
        if (user && postId) {
          const { data: likeRow } = await supabase
            .from("social_post_likes")
            .select("post_id")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .maybeSingle();
          liked = !!likeRow;
        }

        if (cancelled) return;

        setAnchor(postId
          ? { id: postId, likes: postRow!.likes_count, liked }
          : null
        );

        // 3. Load comments only if anchor exists
        if (postId) {
          const { data: commentRows, error: commentErr } = await supabase
            .from("social_comments")
            .select("id, post_id, user_id, text, created_at")
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

          if (commentErr) throw commentErr;
          if (cancelled) return;

          setComments(
            (commentRows ?? []).map((c) => ({
              id: c.id,
              postId: c.post_id,
              userId: c.user_id,
              text: c.text,
              createdAt: c.created_at,
            }))
          );
        } else {
          setComments([]);
        }
      } catch (err) {
        console.error("[use-video-social] load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [videoId, user?.id]);

  // ── Real-time subscriptions ─────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return;

    // Subscribe to like-count changes on the anchor post
    const postsSub = supabase
      .channel(`vsocial-posts-${videoId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "social_posts" },
        (payload) => {
          const updated = payload.new as { id: string; likes_count: number };
          if (anchorRef.current?.id !== updated.id) return;
          setAnchor((prev) =>
            prev ? { ...prev, likes: updated.likes_count } : prev
          );
        }
      )
      .subscribe();

    // Subscribe to new comments on this video's anchor
    const commentsSub = supabase
      .channel(`vsocial-comments-${videoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_comments" },
        (payload) => {
          const c = payload.new as {
            id: string; post_id: string; user_id: string; text: string; created_at: string;
          };
          if (c.post_id !== anchorRef.current?.id) return;
          setComments((prev) => {
            if (prev.some((x) => x.id === c.id)) return prev;
            return [
              ...prev,
              { id: c.id, postId: c.post_id, userId: c.user_id, text: c.text, createdAt: c.created_at },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "social_comments" },
        (payload) => {
          const deletedId = (payload.old as { id: string })?.id;
          if (deletedId) setComments((prev) => prev.filter((c) => c.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      postsSub.unsubscribe();
      commentsSub.unsubscribe();
    };
  }, [videoId]);

  // ── Helpers ────────────────────────────────────────────────────────────

  /**
   * Ensures the social anchor post exists, creating it if needed.
   * Returns the anchor's post ID, or null on failure.
   */
  const ensureAnchor = useCallback(async (): Promise<string | null> => {
    if (!user) {
      toast.error("Sign in to interact");
      return null;
    }

    if (anchorRef.current) return anchorRef.current.id;

    // Create the anchor post (upsert to handle race conditions)
    const { data, error } = await supabase
      .from("social_posts")
      .upsert(
        { user_id: user.id, text: `video:${videoId}`, likes_count: 0 },
        { onConflict: "text", ignoreDuplicates: false }
      )
      .select("id, likes_count")
      .single();

    if (error || !data) {
      // If upsert failed because row already exists, fetch it
      const { data: existing } = await supabase
        .from("social_posts")
        .select("id, likes_count")
        .eq("text", `video:${videoId}`)
        .single();

      if (existing) {
        const newAnchor = { id: existing.id, likes: existing.likes_count, liked: false };
        setAnchor(newAnchor);
        anchorRef.current = newAnchor;
        return existing.id;
      }

      console.error("[use-video-social] ensureAnchor error:", error);
      return null;
    }

    const newAnchor = { id: data.id, likes: data.likes_count, liked: false };
    setAnchor(newAnchor);
    anchorRef.current = newAnchor;
    return data.id;
  }, [user, videoId]);

  // ── Public actions ─────────────────────────────────────────────────────

  const toggleLike = useCallback(async () => {
    if (!user) {
      toast.error("Sign in to like videos");
      return;
    }

    const postId = await ensureAnchor();
    if (!postId) return;

    const isLiked = anchorRef.current?.liked ?? false;

    // Optimistic update
    setAnchor((prev) =>
      prev
        ? {
            ...prev,
            liked: !isLiked,
            likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
          }
        : prev
    );

    if (isLiked) {
      const { error } = await supabase
        .from("social_post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        // Revert
        setAnchor((prev) =>
          prev ? { ...prev, liked: true, likes: prev.likes + 1 } : prev
        );
        toast.error("Could not unlike");
      }
    } else {
      const { error } = await supabase
        .from("social_post_likes")
        .insert({ post_id: postId, user_id: user.id });

      if (error && error.code !== "23505") {
        // Revert (ignore duplicate-key: means it's already liked)
        setAnchor((prev) =>
          prev ? { ...prev, liked: false, likes: Math.max(0, prev.likes - 1) } : prev
        );
        toast.error("Could not like");
      }
    }
  }, [user, ensureAnchor]);

  const addComment = useCallback(
    async (text: string) => {
      if (!user) {
        toast.error("Sign in to comment");
        return;
      }
      if (!text.trim()) return;

      const postId = await ensureAnchor();
      if (!postId) return;

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimistic: VideoComment = {
        id: tempId,
        postId,
        userId: user.id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, optimistic]);

      const { data, error } = await supabase
        .from("social_comments")
        .insert({ post_id: postId, user_id: user.id, text: text.trim() })
        .select("id, post_id, user_id, text, created_at")
        .single();

      if (error || !data) {
        // Revert
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        toast.error("Could not post comment");
        return;
      }

      // Replace temp with real row
      setComments((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? { id: data.id, postId: data.post_id, userId: data.user_id, text: data.text, createdAt: data.created_at }
            : c
        )
      );
    },
    [user, ensureAnchor]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!user) return;

      setComments((prev) => prev.filter((c) => c.id !== commentId));

      const { error } = await supabase
        .from("social_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Could not delete comment");
        // Reload to restore
      }
    },
    [user]
  );

  // ── Derived values ─────────────────────────────────────────────────────

  return {
    // State
    anchor,
    comments,
    loading,
    // Derived
    liked: anchor?.liked ?? false,
    likeCount: anchor?.likes ?? 0,
    commentCount: comments.length,
    isLoggedIn: !!user,
    // Actions
    toggleLike,
    addComment,
    deleteComment,
  };
}
