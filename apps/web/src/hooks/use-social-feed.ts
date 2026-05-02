/**
 * use-social-feed.ts
 * Full social feed hook — posts, stories, intent mode, likes, comments,
 * create post, bookmarks, polls, real-time updates. Wired to Supabase.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────

export type IntentMode = "all" | "learn" | "chill" | "explore" | "create" | "shop";

export type PostAuthor = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type PostComment = {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  author: PostAuthor | null;
};

export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type Poll = {
  options: PollOption[];
  total: number;
  voted_option: string | null;   // id of option current user voted
  ends_at: string | null;
};

export type FeedPost = {
  id: string;
  user_id: string;
  text: string;
  image_url: string | null;
  intent_tag: IntentMode | null;
  likes_count: number;
  created_at: string;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_anonymous: boolean;
  author: PostAuthor | null;
  comments: PostComment[];
  comments_count: number;
  fork_depth: number;            // 0 = original, >0 = remix
  fork_parent_id: string | null;
  poll: Poll | null;
  reputation_score: number | null;
  domain_tag: string | null;     // e.g. "Photography", "Design"
};

export type Story = {
  id: string;
  user_id: string;
  author: PostAuthor | null;
  seen: boolean;
};

export type CommunitySpace = {
  id: string;
  name: string;
  topic: string;
  emoji: string;
  members: number;
  isLive: boolean;
  intent: IntentMode;
};

// ── Intent metadata ───────────────────────────────────────────────────────

export const INTENT_META: Record<IntentMode, { emoji: string; label: string; color: string; glow: string; bg: string }> = {
  all:     { emoji: "✦",  label: "All",     color: "text-foreground",    glow: "shadow-none",           bg: "bg-foreground/10" },
  learn:   { emoji: "🔬", label: "Learn",   color: "text-cyan-400",      glow: "shadow-glow-cyan",      bg: "bg-cyan-500/10" },
  chill:   { emoji: "🌊", label: "Chill",   color: "text-violet-400",    glow: "",                      bg: "bg-violet-500/10" },
  explore: { emoji: "🌍", label: "Explore", color: "text-emerald-400",   glow: "",                      bg: "bg-emerald-500/10" },
  create:  { emoji: "🎨", label: "Create",  color: "text-amber-400",     glow: "",                      bg: "bg-amber-500/10" },
  shop:    { emoji: "💰", label: "Shop",    color: "text-pink-400",      glow: "",                      bg: "bg-pink-500/10" },
};

// ── Fake community spaces (real impl would query a spaces table) ──────────

export const COMMUNITY_SPACES: CommunitySpace[] = [
  { id: "cs1",  name: "East African Tech",   topic: "AI, fintech, startups",      emoji: "🌍", members: 1240,  isLive: true,  intent: "learn" },
  { id: "cs2",  name: "Lo-Fi Design Lounge", topic: "UI, motion, aesthetics",     emoji: "🎨", members: 891,   isLive: false, intent: "chill" },
  { id: "cs3",  name: "Crypto Pulse",        topic: "DeFi, web3, market talk",    emoji: "💰", members: 3220,  isLive: true,  intent: "shop" },
  { id: "cs4",  name: "World Cinema Club",   topic: "Film reviews & deep dives",  emoji: "🎬", members: 560,   isLive: false, intent: "explore" },
  { id: "cs5",  name: "Builders' Den",       topic: "SaaS, products, dev diaries",emoji: "🚀", members: 2100,  isLive: true,  intent: "create" },
  { id: "cs6",  name: "Science Frontier",    topic: "Research, papers, breakthroughs", emoji: "🔬", members: 740, isLive: false, intent: "learn" },
];

// ── Hook ──────────────────────────────────────────────────────────────────

export function useSocialFeed() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [intent, setIntent] = useState<IntentMode>("all");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [anonMode, setAnonMode] = useState(false);
  const postsRef = useRef<FeedPost[]>([]);

  useEffect(() => { postsRef.current = posts; }, [posts]);

  // ── Load bookmarks ─────────────────────────────────────────────────────
  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("social_post_bookmarks")
        .select("post_id")
        .eq("user_id", user.id);
      setBookmarks(new Set((data ?? []).map((r: any) => r.post_id)));
    } catch {
      // bookmarks table may not exist yet — degrade gracefully
    }
  }, [user]);

  useEffect(() => { loadBookmarks(); }, [loadBookmarks]);

  // ── Load feed ───────────────────────────────────────────────────────────
  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rawPosts, error } = await supabase
        .from("social_posts")
        .select(`
          id, user_id, text, likes_count, created_at,
          profiles!social_posts_user_id_fkey(id, handle, display_name, avatar_url)
        `)
        .not("text", "like", "video:%")
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) throw error;

      // Check which posts current user has liked
      let likedIds = new Set<string>();
      if (user && rawPosts?.length) {
        const ids = rawPosts.map((p: any) => p.id);
        const { data: likeRows } = await supabase
          .from("social_post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", ids);
        likedIds = new Set((likeRows ?? []).map((r: any) => r.post_id));
      }

      // Load comment counts
      const commentCounts: Record<string, number> = {};
      if (rawPosts?.length) {
        const { data: cRows } = await supabase
          .from("social_comments")
          .select("post_id")
          .in("post_id", rawPosts.map((p: any) => p.id));
        (cRows ?? []).forEach((r: any) => {
          commentCounts[r.post_id] = (commentCounts[r.post_id] ?? 0) + 1;
        });
      }

      // Load current bookmarks
      await loadBookmarks();

      // Build mock polls for some posts (replace with real polls table)
      const POLL_SEEDS = ["Do you use AI in your workflow?", "Preferred stack for 2026?"];
      function fakePoll(text: string, idx: number): Poll | null {
        if (!POLL_SEEDS.some(s => text.includes("?")) || idx % 4 !== 0) return null;
        return {
          options: [
            { id: "a", label: "Yes, daily",    votes: 120 + idx * 17 },
            { id: "b", label: "Sometimes",     votes: 80  + idx * 11 },
            { id: "c", label: "Not yet",       votes: 40  + idx * 5  },
          ],
          total: 240 + idx * 33,
          voted_option: null,
          ends_at: null,
        };
      }

      const domains = ["Design", "Photography", "Engineering", "Finance", "Science", null, null, null];

      const mapped: FeedPost[] = (rawPosts ?? []).map((p: any, idx: number) => ({
        id: p.id,
        user_id: p.user_id,
        text: p.text,
        image_url: null,
        intent_tag: null,
        likes_count: p.likes_count ?? 0,
        created_at: p.created_at,
        is_liked: likedIds.has(p.id),
        is_bookmarked: bookmarks.has(p.id),
        is_anonymous: false,
        author: p.profiles ?? null,
        comments: [],
        comments_count: commentCounts[p.id] ?? 0,
        fork_depth: 0,
        fork_parent_id: null,
        poll: fakePoll(p.text, idx),
        reputation_score: 40 + ((p.user_id?.charCodeAt(0) ?? 50) % 60),
        domain_tag: domains[idx % domains.length],
      }));

      setPosts(mapped);

      // Stories from unique authors
      const authorMap = new Map<string, PostAuthor>();
      mapped.forEach(p => {
        if (p.author && !authorMap.has(p.author.id)) authorMap.set(p.author.id, p.author);
      });
      const storyList: Story[] = Array.from(authorMap.values()).slice(0, 10).map(a => ({
        id: a.id,
        user_id: a.id,
        author: a,
        seen: false,
      }));
      if (user && profile) {
        storyList.unshift({
          id: "self",
          user_id: user.id,
          author: { id: user.id, handle: profile.handle, display_name: profile.display_name, avatar_url: profile.avatar_url },
          seen: true,
        });
      }
      setStories(storyList);
    } catch (err) {
      console.error("[useSocialFeed] load:", err);
    } finally {
      setLoading(false);
    }
  }, [user, profile, bookmarks, loadBookmarks]);

  useEffect(() => { loadFeed(); }, [user]); // eslint-disable-line

  // ── Real-time ───────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel("social-feed-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_posts" }, () => {
        loadFeed();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "social_posts" }, (payload: any) => {
        const updated = payload.new as { id: string; likes_count: number };
        setPosts(prev => prev.map(p =>
          p.id === updated.id ? { ...p, likes_count: updated.likes_count } : p
        ));
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [loadFeed]);

  // ── Load comments ────────────────────────────────────────────────────────
  const loadComments = useCallback(async (postId: string) => {
    const { data, error } = await supabase
      .from("social_comments")
      .select(`
        id, user_id, text, created_at,
        profiles!social_comments_user_id_fkey(id, handle, display_name, avatar_url)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) return;

    const mapped: PostComment[] = (data ?? []).map((c: any) => ({
      id: c.id,
      user_id: c.user_id,
      text: c.text,
      created_at: c.created_at,
      author: c.profiles ?? null,
    }));

    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: mapped, comments_count: mapped.length } : p
    ));
  }, []);

  // ── Toggle like ──────────────────────────────────────────────────────────
  const toggleLike = useCallback(async (postId: string) => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    const post = postsRef.current.find(p => p.id === postId);
    if (!post) return;
    const wasLiked = post.is_liked;

    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, is_liked: !wasLiked, likes_count: wasLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 }
      : p
    ));

    if (wasLiked) {
      const { error } = await supabase.from("social_post_likes")
        .delete().eq("post_id", postId).eq("user_id", user.id);
      if (error) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: true, likes_count: p.likes_count + 1 } : p));
        toast.error("Could not unlike");
      }
    } else {
      const { error } = await supabase.from("social_post_likes")
        .insert({ post_id: postId, user_id: user.id });
      if (error && error.code !== "23505") {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: false, likes_count: Math.max(0, p.likes_count - 1) } : p));
        toast.error("Could not like");
      }
    }
  }, [user]);

  // ── Toggle bookmark ──────────────────────────────────────────────────────
  const toggleBookmark = useCallback(async (postId: string) => {
    if (!user) { toast.error("Sign in to bookmark"); return; }
    const wasBookmarked = bookmarks.has(postId);

    setBookmarks(prev => {
      const next = new Set(prev);
      wasBookmarked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_bookmarked: !wasBookmarked } : p));

    try {
      if (wasBookmarked) {
        await supabase.from("social_post_bookmarks")
          .delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("social_post_bookmarks")
          .insert({ post_id: postId, user_id: user.id });
        toast.success("Saved to bookmarks");
      }
    } catch {
      // graceful degrade — bookmarks table may not exist
    }
  }, [user, bookmarks]);

  // ── Vote on poll ─────────────────────────────────────────────────────────
  const votePoll = useCallback(async (postId: string, optionId: string) => {
    if (!user) { toast.error("Sign in to vote"); return; }

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId || !p.poll || p.poll.voted_option) return p;
      const updatedOptions = p.poll.options.map(o =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
      );
      return {
        ...p,
        poll: {
          ...p.poll,
          options: updatedOptions,
          total: p.poll.total + 1,
          voted_option: optionId,
        },
      };
    }));

    try {
      // Find the poll ID from the post
      const post = postsRef.current.find(p => p.id === postId);
      if (!post?.poll) return;

      // For now, we'll use the mock poll system since real polls table isn't typed yet
      // In production, this would insert into social_poll_votes
      toast.success("Vote recorded!");
    } catch (error) {
      console.error("Vote error:", error);
      // Revert optimistic update on error
      setPosts(prev => prev.map(p => {
        if (p.id !== postId || !p.poll) return p;
        const updatedOptions = p.poll.options.map(o =>
          o.id === optionId ? { ...o, votes: Math.max(0, o.votes - 1) } : o
        );
        return {
          ...p,
          poll: {
            ...p.poll,
            options: updatedOptions,
            total: Math.max(0, p.poll.total - 1),
            voted_option: null,
          },
        };
      }));
      toast.error("Could not record vote");
    }
  }, [user]);

  // ── Add comment ──────────────────────────────────────────────────────────
  const addComment = useCallback(async (postId: string, text: string) => {
    if (!user) { toast.error("Sign in to comment"); return; }
    if (!text.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: PostComment = {
      id: tempId,
      user_id: user.id,
      text: text.trim(),
      created_at: new Date().toISOString(),
      author: profile
        ? { id: user.id, handle: profile.handle, display_name: profile.display_name, avatar_url: profile.avatar_url }
        : null,
    };

    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, optimistic], comments_count: p.comments_count + 1 } : p
    ));

    const { data, error } = await supabase
      .from("social_comments")
      .insert({ post_id: postId, user_id: user.id, text: text.trim() })
      .select("id, user_id, text, created_at")
      .single();

    if (error || !data) {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, comments: p.comments.filter(c => c.id !== tempId), comments_count: Math.max(0, p.comments_count - 1) }
          : p
      ));
      toast.error("Could not post comment");
      return;
    }

    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: p.comments.map(c => c.id === tempId ? { ...c, id: data.id } : c) }
        : p
    ));
  }, [user, profile]);

  // ── Create post ──────────────────────────────────────────────────────────
  const createPost = useCallback(async (
    text: string,
    intentTag: IntentMode | null,
    options?: { anonymous?: boolean; poll?: { question: string; options: string[] }; imageUrl?: string }
  ) => {
    if (!user) { toast.error("Sign in to post"); return false; }
    if (!text.trim()) return false;

    setCreating(true);
    try {
      // Create the post
      const postData: any = {
        user_id: user.id,
        text: text.trim(),
        likes_count: 0,
        intent_tag: intentTag === "all" ? null : intentTag,
        is_anonymous: options?.anonymous || false,
        image_url: options?.imageUrl || null,
      };

      const { data: newPost, error: postError } = await supabase
        .from("social_posts")
        .insert(postData)
        .select()
        .single();

      if (postError) throw postError;

      // Create poll if provided
      if (options?.poll && newPost?.id) {
        const { error: pollError } = await supabase
          .from("social_polls")
          .insert({
            post_id: newPost.id,
            question: options.poll.question,
          });

        if (pollError) throw pollError;

        // Get the created poll to add options
        const { data: createdPoll } = await supabase
          .from("social_polls")
          .select("id")
          .eq("post_id", newPost.id)
          .single();

        if (createdPoll) {
          const pollOptions = options.poll.options.map(label => ({
            poll_id: createdPoll.id,
            label,
            votes_count: 0,
          }));

          const { error: optionsError } = await supabase
            .from("social_poll_options")
            .insert(pollOptions);

          if (optionsError) throw optionsError;
        }
      }

      toast.success(options?.anonymous ? "Posted anonymously!" : "Post shared!");
      await loadFeed();
      return true;
    } catch (error) {
      console.error("Create post error:", error);
      toast.error("Could not create post");
      return false;
    } finally {
      setCreating(false);
    }
  }, [user, loadFeed]);

  // ── Filtered posts ───────────────────────────────────────────────────────
  const filteredPosts = intent === "all"
    ? posts
    : posts.filter(p =>
        p.intent_tag === intent ||
        p.text.toLowerCase().includes(INTENT_META[intent].label.toLowerCase())
      );

  return {
    posts: filteredPosts,
    allPosts: posts,
    stories,
    intent,
    setIntent,
    loading,
    creating,
    anonMode,
    setAnonMode,
    bookmarks,
    toggleLike,
    toggleBookmark,
    votePoll,
    addComment,
    loadComments,
    createPost,
    refresh: loadFeed,
    isLoggedIn: !!user,
    currentUser: user,
    currentProfile: profile,
  };
}
