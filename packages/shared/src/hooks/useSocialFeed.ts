/**
 * useSocialFeed.ts (shared)
 * Full social hook — intent mode, stories, likes, bookmarks, polls,
 * comments, create post, anonymous mode. Used by web + mobile.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import {
  getSocialPosts,
  likePost,
  unlikePost,
  getComments,
  addComment,
  subscribeToPostLikes,
  supabase,
} from "../supabase";
import { NotificationCreators } from "../notifications";
import type { SocialPost, SocialComment, IntentMode, CommunitySpace, Poll } from "../types";

// ── Intent metadata (shared between web + mobile) ─────────────────────────

export const INTENT_META: Record<IntentMode, { emoji: string; label: string; color: string }> = {
  all:     { emoji: "✦",  label: "All",     color: "#A0A4B8" },
  learn:   { emoji: "🔬", label: "Learn",   color: "#3BC4C4" },
  chill:   { emoji: "🌊", label: "Chill",   color: "#8B5CF6" },
  explore: { emoji: "🌍", label: "Explore", color: "#10B981" },
  create:  { emoji: "🎨", label: "Create",  color: "#F59E0B" },
  shop:    { emoji: "💰", label: "Shop",    color: "#EC4899" },
};

// ── Community Spaces ──────────────────────────────────────────────────────

export const COMMUNITY_SPACES: CommunitySpace[] = [
  { id: "cs1", name: "East African Tech",    topic: "AI, fintech, startups",       emoji: "🌍", members: 1240,  isLive: true,  intent: "learn" },
  { id: "cs2", name: "Lo-Fi Design Lounge",  topic: "UI, motion, aesthetics",      emoji: "🎨", members: 891,   isLive: false, intent: "chill" },
  { id: "cs3", name: "Crypto Pulse",         topic: "DeFi, web3, market talk",     emoji: "💰", members: 3220,  isLive: true,  intent: "shop" },
  { id: "cs4", name: "World Cinema Club",    topic: "Film reviews & deep dives",   emoji: "🎬", members: 560,   isLive: false, intent: "explore" },
  { id: "cs5", name: "Builders' Den",        topic: "SaaS, products, dev diaries", emoji: "🚀", members: 2100,  isLive: true,  intent: "create" },
  { id: "cs6", name: "Science Frontier",     topic: "Research, papers, breakthroughs", emoji: "🔬", members: 740, isLive: false, intent: "learn" },
];

// ── Reputation helper ─────────────────────────────────────────────────────

const DOMAIN_TAGS = ["Design", "Engineering", "Photography", "Finance", "Science", null, null, null];

function getReputationTier(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Elite",   color: "#F59E0B" };
  if (score >= 70) return { label: "Expert",  color: "#3BC4C4" };
  if (score >= 50) return { label: "Notable", color: "#8B5CF6" };
  return                  { label: "Rising",  color: "#6B7280" };
}

export { getReputationTier };

// ── Enrich a raw post with derived fields ─────────────────────────────────

function enrichPost(raw: SocialPost, idx: number, likedSet: Set<string>, bookmarkedSet: Set<string>): SocialPost {
  // Create a simple poll for posts with "?" in text at certain positions (demo)
  let poll: Poll | null = null;
  if (raw.text.includes("?") && idx % 4 === 0) {
    poll = {
      options: [
        { id: "a", label: "Yes, daily",   votes: 120 + idx * 17 },
        { id: "b", label: "Sometimes",    votes: 80  + idx * 11 },
        { id: "c", label: "Not yet",      votes: 40  + idx * 5  },
      ],
      total: 240 + idx * 33,
      voted_option: null,
      ends_at: null,
    };
  }

  return {
    ...raw,
    is_liked: likedSet.has(raw.id),
    is_bookmarked: bookmarkedSet.has(raw.id),
    is_anonymous: false,
    fork_depth: 0,
    fork_parent_id: null,
    intent_tag: null,
    poll,
    reputation_score: 40 + ((raw.user_id?.charCodeAt(0) ?? 50) % 60),
    domain_tag: DOMAIN_TAGS[idx % DOMAIN_TAGS.length],
  };
}

// ── Main hook ─────────────────────────────────────────────────────────────

export function useSocialFeed(initialLimit = 20) {
  const [limit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);
  const [intent, setIntent] = useState<IntentMode>("all");
  const [anonMode, setAnonMode] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({}); // postId -> optionId
  const [creating, setCreating] = useState(false);

  const queryClient = useQueryClient();

  // ── Fetch posts ───────────────────────────────────────────────────────────
  const { data: rawPosts = [], isLoading, error } = useQuery<SocialPost[]>({
    queryKey: ["social-posts", limit, offset],
    queryFn: async () => (await getSocialPosts(limit, offset)) as unknown as SocialPost[],
    staleTime: 1000 * 60 * 5,
  });

  // ── Get current user's liked posts ───────────────────────────────────────
  const { data: likedIdSet = new Set<string>() } = useQuery<Set<string>>({
    queryKey: ["social-liked-ids"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !rawPosts.length) return new Set<string>();
      const { data } = await supabase
        .from("social_post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", rawPosts.map((p) => p.id));
      return new Set((data ?? []).map((r: any) => r.post_id));
    },
    enabled: rawPosts.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // ── Enrich posts with derived fields ──────────────────────────────────────
  const posts: SocialPost[] = rawPosts.map((p, i) => {
    const enriched = enrichPost(p, i, likedIdSet as Set<string>, bookmarkedIds);
    // Apply local vote state
    if (enriched.poll && votedPolls[p.id]) {
      const optId = votedPolls[p.id];
      const updatedOptions = enriched.poll.options.map((o) =>
        o.id === optId ? { ...o } : o
      );
      enriched.poll = { ...enriched.poll, options: updatedOptions, voted_option: optId };
    }
    return enriched;
  });

  // ── Filter by intent ──────────────────────────────────────────────────────
  const filteredPosts = intent === "all"
    ? posts
    : posts.filter((p) =>
        p.intent_tag === intent ||
        p.text.toLowerCase().includes(INTENT_META[intent].label.toLowerCase())
      );

  // ── Stories (derived from recent post authors) ────────────────────────────
  const stories = (() => {
    const seen = new Set<string>();
    const out: Array<{ id: string; userId: string; author: SocialPost["profile"] | null; seen: boolean }> = [];
    for (const p of posts) {
      if (p.author && !seen.has(p.user_id)) {
        seen.add(p.user_id);
        out.push({ id: p.user_id, userId: p.user_id, author: p.profile ?? null, seen: false });
      }
      if (out.length >= 10) break;
    }
    return out;
  })();

  // ── Like mutation ─────────────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: ({ postId, userId, postAuthorId, likerUsername }: {
      postId: string; userId: string; postAuthorId: string; likerUsername: string;
    }) => likePost(postId, userId),
    onSuccess: async (_, variables) => {
      queryClient.setQueryData(["social-posts", limit, offset], (old: SocialPost[] = []) =>
        old.map((p) =>
          p.id === variables.postId
            ? { ...p, likes_count: p.likes_count + 1, is_liked: true }
            : p
        )
      );
      if (variables.postAuthorId !== variables.userId) {
        try {
          await NotificationCreators.likePost(
            variables.postId, variables.postAuthorId, variables.userId, variables.likerUsername
          );
        } catch {}
      }
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      unlikePost(postId, userId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["social-posts", limit, offset], (old: SocialPost[] = []) =>
        old.map((p) =>
          p.id === variables.postId
            ? { ...p, likes_count: Math.max(0, p.likes_count - 1), is_liked: false }
            : p
        )
      );
    },
  });

  const handleLike = useCallback((postId: string, userId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post?.is_liked) {
      unlikeMutation.mutate({ postId, userId });
    } else {
      likeMutation.mutate({
        postId, userId,
        postAuthorId: post?.user_id ?? userId,
        likerUsername: post?.profile?.username ?? "Someone",
      });
    }
  }, [posts, likeMutation, unlikeMutation]);

  // ── Bookmark toggle ───────────────────────────────────────────────────────
  const handleBookmark = useCallback(async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const wasBookmarked = bookmarkedIds.has(postId);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      wasBookmarked ? next.delete(postId) : next.add(postId);
      return next;
    });

    try {
      if (wasBookmarked) {
        await supabase.from("social_post_bookmarks")
          .delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("social_post_bookmarks")
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch {
      // Table may not exist yet — degrade gracefully
    }
  }, [bookmarkedIds]);

  // ── Poll vote ─────────────────────────────────────────────────────────────
  const votePoll = useCallback((postId: string, optionId: string) => {
    if (votedPolls[postId]) return; // already voted
    setVotedPolls((prev) => ({ ...prev, [postId]: optionId }));
    queryClient.setQueryData(["social-posts", limit, offset], (old: SocialPost[] = []) =>
      old.map((p) => {
        if (p.id !== postId || !p.poll || p.poll.voted_option) return p;
        const updatedOptions = p.poll.options.map((o) =>
          o.id === optionId ? { ...o, votes: o.votes + 1 } : o
        );
        return { ...p, poll: { ...p.poll, options: updatedOptions, total: p.poll.total + 1, voted_option: optionId } };
      })
    );
  }, [votedPolls, queryClient, limit, offset]);

  // ── Create post ───────────────────────────────────────────────────────────
  const createPost = useCallback(async (
    text: string,
    intentTag: IntentMode | null = null,
    opts?: { anonymous?: boolean }
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !text.trim()) return false;

    setCreating(true);
    try {
      const { error: err } = await supabase
        .from("social_posts")
        .insert({ user_id: user.id, text: text.trim(), likes_count: 0 });
      if (err) throw err;
      await queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      return true;
    } catch {
      return false;
    } finally {
      setCreating(false);
    }
  }, [queryClient]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    setOffset((prev) => prev + limit);
  }, [limit]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    queryClient.invalidateQueries({ queryKey: ["social-liked-ids"] });
  }, [queryClient]);

  return {
    posts: filteredPosts,
    allPosts: posts,
    stories,
    isLoading,
    error,
    intent,
    setIntent,
    anonMode,
    setAnonMode,
    creating,
    hasNextPage: posts.length >= limit,
    isFetchingNextPage: false,
    handleLike,
    handleBookmark,
    votePoll,
    createPost,
    loadMore,
    refresh,
    isLiking: likeMutation.isPending || unlikeMutation.isPending,
  };
}

// ── Comments hook (unchanged) ─────────────────────────────────────────────

export function useComments(postId: string) {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
    staleTime: 1000 * 60 * 2,
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ content, userId, postAuthorId, commenterUsername }: {
      content: string; userId: string; postAuthorId: string; commenterUsername: string;
    }) => addComment(postId, userId, content),
    onSuccess: async (newComment, variables) => {
      queryClient.setQueryData(["comments", postId], (old: SocialComment[] = []) => [
        ...old,
        newComment,
      ]);
      if (variables.postAuthorId !== variables.userId) {
        try {
          await NotificationCreators.commentOnPost(
            postId, variables.postAuthorId, variables.userId,
            variables.commenterUsername, variables.content
          );
        } catch {}
      }
    },
  });

  const handleAddComment = useCallback(
    (content: string, userId: string, postAuthorId = userId, commenterUsername = "Someone") => {
      addCommentMutation.mutate({ content, userId, postAuthorId, commenterUsername });
    },
    [addCommentMutation]
  );

  return {
    comments,
    isLoading,
    error,
    handleAddComment,
    isAddingComment: addCommentMutation.isPending,
  };
}

// ── Creator Profile Hooks ──────────────────────────────────────────────────

export function useCreatorProfile(creatorId: string) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ["creator-profile", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", creatorId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
  });

  const { data: tiers = [], isLoading: isTiersLoading, error: tiersError } = useQuery({
    queryKey: ["creator-tiers", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_tiers")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
  });

  const { data: subscription = null, isLoading: isSubscriptionLoading, error: subscriptionError } = useQuery({
    queryKey: ["creator-subscription", creatorId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("creator_subscriptions")
        .select("*, tier:creator_tiers(*)")
        .eq("subscriber_id", user.id)
        .eq("creator_id", creatorId)
        .eq("active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!creatorId,
  });

  const { data: stats = null, isLoading: isStatsLoading, error: statsError } = useQuery({
    queryKey: ["creator-stats", creatorId],
    queryFn: async () => {
      const [{ data: baseData, error: baseError }, { data: revenueData, error: revenueError }] =
        await Promise.all([
          supabase.rpc("get_creator_stats", { creator_id: creatorId }),
          supabase.rpc("get_creator_subscription_stats", { creator_id: creatorId }),
        ]);

      if (baseError) throw baseError;
      if (revenueError) throw revenueError;

      return {
        followers_count: baseData?.followers_count ?? 0,
        following_count: baseData?.following_count ?? 0,
        posts_count: baseData?.posts_count ?? 0,
        total_likes: baseData?.total_likes ?? 0,
        total_subscribers: revenueData?.total_subscribers ?? 0,
        active_subscribers: revenueData?.active_subscribers ?? 0,
        total_earnings: revenueData?.total_earnings ?? 0,
        monthly_earnings: revenueData?.monthly_earnings ?? 0,
        domain_expertise: profile?.bio ? profile.bio.split(/[ ,]+/).slice(0, 4) : [],
        total_views: 0,
        reputation_score: profile?.username ? 70 + (profile.username.length % 30) : 65,
      };
    },
    enabled: !!creatorId,
  });

  const { data: creatorPosts = [] } = useQuery({
    queryKey: ["creator-posts", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select(
          `
            *,
            profile:profiles(*),
            comments:social_comments(count)
          `,
        )
        .eq("user_id", creatorId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
  });

  const { data: creatorVideos = [] } = useQuery({
    queryKey: ["creator-videos", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_videos")
        .select("*")
        .eq("user_id", creatorId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ tierId }: { tierId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("creator_subscriptions")
        .insert({
          subscriber_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
          active: true,
          auto_renew: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-subscription", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["creator-stats", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["creator-posts", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["creator-videos", creatorId] });
    },
  });

  const tipMutation = useMutation({
    mutationFn: async ({ amount, message, isAnonymous }: {
      amount: number;
      message?: string;
      isAnonymous?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tips")
        .insert({
          from_user_id: user.id,
          to_user_id: creatorId,
          amount,
          currency: "USD",
          message: message || "",
          is_anonymous: isAnonymous || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-stats", creatorId] });
    },
  });

  return {
    profile,
    tiers,
    subscription,
    stats,
    creatorPosts,
    creatorVideos,
    isLoading: isProfileLoading || isTiersLoading || isSubscriptionLoading || isStatsLoading,
    error: profileError || tiersError || subscriptionError || statsError,
    subscribe: subscribeMutation.mutate,
    tip: tipMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    isTipping: tipMutation.isPending,
  };
}

export function useGatedContent(creatorId: string) {
  const { data: content = [], isLoading, error } = useQuery({
    queryKey: ["gated-content", creatorId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("gated_content")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
  });

  return {
    content,
    isLoading,
    error,
  };
}

export function useRealtimePost(postId: string) {
  const queryClient = useQueryClient();

  const subscribeToPostUpdates = useCallback(() => {
    const subscription = subscribeToPostLikes(postId, (payload: any) => {
      if (payload.eventType === "INSERT") {
        queryClient.setQueryData(["social-posts"], (old: SocialPost[] = []) =>
          old.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p)
        );
      } else if (payload.eventType === "DELETE") {
        queryClient.setQueryData(["social-posts"], (old: SocialPost[] = []) =>
          old.map((p) => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p)
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [postId, queryClient]);

  return { subscribeToPostUpdates };
}
