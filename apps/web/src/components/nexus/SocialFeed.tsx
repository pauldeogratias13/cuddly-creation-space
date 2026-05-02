/**
 * SocialFeed.tsx — NEXUS Social Experience (v2)
 * Intent-first feed · Stories · Polls · Bookmarks · Fork trees
 * Community Spaces · Reputation badges · Anonymous mode · AI Twin bar
 */
import { useState, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  GitBranch, Sparkles, Send, Image as ImageIcon, Smile,
  TrendingUp, Users, Zap, ShieldCheck, Plus, X, RefreshCw,
  Eye, BarChart2, Lock, BarChart, Ghost, Radio, Flame,
  ChevronDown, Repeat2, ExternalLink, Star,
} from "lucide-react";
import { MediaUpload, type MediaFile } from "@/components/ui/MediaUpload";
import { uploadFile } from "@/lib/storage";
import { Stories } from "@/components/nexus/Stories";
import { CommunitySpaces } from "@/components/nexus/CommunitySpaces";
import { TrendingTopics } from "@/components/nexus/TrendingTopics";
import { PostFork, ForkTree, ForkIndicator as PostForkIndicator } from "@/components/nexus/PostFork";
import { ReputationBadge as UserReputationBadge } from "@/components/nexus/ReputationSystem";
import { NotificationBell } from "@/components/nexus/Notifications";
import {
  useSocialFeed,
  INTENT_META,
  COMMUNITY_SPACES,
  type IntentMode,
  type FeedPost,
  type Poll,
} from "@/hooks/use-social-feed";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

// ── Avatar helper ─────────────────────────────────────────────────────────

function Avatar({
  src, handle, size = "md", ring = false, hasStory = false, seen = false,
}: {
  src?: string | null; handle?: string | null; size?: "xs" | "sm" | "md" | "lg";
  ring?: boolean; hasStory?: boolean; seen?: boolean;
}) {
  const sizes = { xs: "h-7 w-7 text-[10px]", sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-base" };
  const seed = handle ?? "anon";
  const imgSrc = src ?? `https://api.dicebear.com/8.x/identicon/svg?seed=${seed}&backgroundColor=0f172a`;

  return (
    <div className={`relative shrink-0 ${sizes[size]}`}>
      {hasStory && (
        <div className={`absolute inset-0 rounded-full p-[2px] ${seen ? "bg-border" : "bg-aurora"}`}>
          <div className="absolute inset-[2px] rounded-full bg-background" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={seed}
        className={`${sizes[size]} rounded-full object-cover ${ring ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${hasStory ? "relative z-10 m-[3px]" : ""}`}
        style={hasStory ? { width: "calc(100% - 6px)", height: "calc(100% - 6px)" } : {}}
      />
    </div>
  );
}

// ── Intent Bar ────────────────────────────────────────────────────────────

function IntentBar({ intent, setIntent }: { intent: IntentMode; setIntent: (m: IntentMode) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
      {(Object.entries(INTENT_META) as [IntentMode, typeof INTENT_META[IntentMode]][]).map(([mode, meta]) => {
        const active = intent === mode;
        return (
          <motion.button
            key={mode}
            onClick={() => setIntent(mode)}
            whileTap={{ scale: 0.94 }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all whitespace-nowrap border ${
              active
                ? `${meta.bg} border-current ${meta.color}`
                : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground bg-transparent"
            }`}
          >
            <span className="text-base leading-none">{meta.emoji}</span>
            <span>{meta.label}</span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-glow ml-0.5" />}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Stories Bar ───────────────────────────────────────────────────────────

function StoriesBar({ stories, currentUserId }: { stories: ReturnType<typeof useSocialFeed>["stories"]; currentUserId?: string }) {
  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-none py-1 px-0.5">
      {stories.map((story, i) => {
        const isSelf = story.user_id === currentUserId;
        const name = story.author?.display_name ?? story.author?.handle ?? "user";
        return (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="relative">
              <Avatar src={story.author?.avatar_url} handle={story.author?.handle} size="lg" hasStory={!isSelf} seen={story.seen} />
              {isSelf && (
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary border-2 border-background grid place-items-center">
                  <Plus className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors w-14 truncate text-center">
              {isSelf ? "Your story" : name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Reputation Badge ──────────────────────────────────────────────────────

function LocalReputationBadge({ score, domain }: { score: number | null; domain: string | null }) {
  if (!score || !domain) return null;
  const tier = score >= 90 ? { label: "Elite", color: "text-amber-400 border-amber-400/40 bg-amber-500/10" }
             : score >= 70 ? { label: "Expert", color: "text-cyan-400 border-cyan-400/40 bg-cyan-500/10" }
             : score >= 50 ? { label: "Notable", color: "text-violet-400 border-violet-400/40 bg-violet-500/10" }
             :               { label: "Rising", color: "text-muted-foreground border-border bg-surface" };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${tier.color}`}>
      <Star className="h-2 w-2" />
      {domain} · {score}
    </span>
  );
}

// ── Poll Widget ───────────────────────────────────────────────────────────

function PollWidget({ poll, postId, onVote }: { poll: Poll; postId: string; onVote: (postId: string, optionId: string) => void }) {
  const voted = !!poll.voted_option;

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
        <BarChart className="h-3 w-3" />
        Poll · {poll.total.toLocaleString()} votes
      </div>
      {poll.options.map(opt => {
        const pct = poll.total > 0 ? Math.round((opt.votes / poll.total) * 100) : 0;
        const isWinner = voted && opt.votes === Math.max(...poll.options.map(o => o.votes));

        return (
          <button
            key={opt.id}
            disabled={voted}
            onClick={() => onVote(postId, opt.id)}
            className="relative w-full rounded-lg border border-border/50 overflow-hidden text-left transition-all hover:border-primary/40 disabled:cursor-default"
          >
            {/* Progress fill */}
            {voted && (
              <div
                className={`absolute inset-y-0 left-0 ${isWinner ? "bg-primary/20" : "bg-surface"}`}
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex items-center justify-between px-3 py-2">
              <span className={`text-xs font-medium ${poll.voted_option === opt.id ? "text-primary" : "text-foreground"}`}>
                {poll.voted_option === opt.id && <span className="mr-1.5">✓</span>}
                {opt.label}
              </span>
              {voted && <span className="text-[10px] text-muted-foreground font-mono-display">{pct}%</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Fork Indicator ────────────────────────────────────────────────────────

function LocalForkIndicator({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <div className="flex items-center gap-1 text-[10px] text-violet-400 mb-2">
      <GitBranch className="h-3 w-3" />
      <span>Forked · depth {depth}</span>
    </div>
  );
}

// ── Post Composer ─────────────────────────────────────────────────────────

function PostComposer({
  profile, onPost, creating, intent, anonMode, setAnonMode,
}: {
  profile: ReturnType<typeof useAuth>["profile"];
  onPost: (text: string, intent: IntentMode | null, opts?: { anonymous?: boolean; poll?: { question: string; options: string[] }; imageUrl?: string }) => Promise<boolean>;
  creating: boolean;
  intent: IntentMode;
  anonMode: boolean;
  setAnonMode: (v: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    // Get the first uploaded media file (for now, support single image per post)
    const imageUrl = mediaFiles.find(f => f.url)?.url;
    
    // Prepare poll data if poll builder is active
    const pollData = showPollBuilder && pollOptions.filter(opt => opt.trim()).length >= 2
      ? {
          question: "What do you think?", // Could be made configurable
          options: pollOptions.filter(opt => opt.trim()),
        }
      : undefined;

    const ok = await onPost(text, intent === "all" ? null : intent, { 
      anonymous: anonMode, 
      imageUrl,
      poll: pollData,
    });
    
    if (ok) { 
      setText(""); 
      setExpanded(false); 
      setShowPollBuilder(false); 
      setPollOptions(["", ""]);
      setMediaFiles([]);
      setShowMediaUpload(false);
    }
  }, [text, intent, anonMode, onPost, mediaFiles, showPollBuilder, pollOptions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  }, [handleSubmit]);

  const intentMeta = INTENT_META[intent];

  return (
    <motion.div
      layout
      className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-4 shadow-card-elevated"
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <Avatar src={anonMode ? null : profile?.avatar_url} handle={anonMode ? "anonymous" : profile?.handle} size="md" ring />
          {anonMode && (
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-violet-500 border-2 border-background grid place-items-center">
              <Ghost className="h-2 w-2 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {anonMode && (
            <p className="text-[10px] text-violet-400 mb-1.5 flex items-center gap-1">
              <Ghost className="h-2.5 w-2.5" />
              Posting anonymously — your identity is hidden
            </p>
          )}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => { setText(e.target.value); setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder={`Share in ${intentMeta.label} mode ${intentMeta.emoji} — ⌘↵ to post`}
            rows={expanded ? 3 : 1}
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed"
          />

          {/* Media upload */}
          <AnimatePresence>
            {showMediaUpload && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <MediaUpload
                  onUpload={setMediaFiles}
                  maxFiles={1}
                  maxSize={10}
                  acceptedTypes={["image/*", "video/*"]}
                  className="border border-border/60 rounded-xl"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Poll builder */}
          <AnimatePresence>
            {showPollBuilder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 border border-border/60 rounded-xl p-3"
              >
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Poll options</p>
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    value={opt}
                    onChange={e => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs outline-none focus:border-primary/50 transition-colors"
                  />
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={() => setPollOptions(p => [...p, ""])}
                    className="text-[10px] text-primary hover:underline"
                  >
                    + Add option
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media preview */}
          {mediaFiles.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                {mediaFiles.map(file => (
                  <div key={file.id} className="relative">
                    <img
                      src={file.preview}
                      alt="Upload preview"
                      className="w-16 h-16 rounded-lg object-cover border border-border/50"
                    />
                    <button
                      onClick={() => setMediaFiles([])}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center hover:bg-destructive/80"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between mt-3 pt-3 border-t border-border/50"
              >
                <div className="flex items-center gap-3 text-muted-foreground">
                  <button
                    onClick={() => setShowMediaUpload(v => !v)}
                    title="Attach image"
                    className={`hover:text-primary transition-colors ${showMediaUpload ? "text-primary" : ""}`}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                  <button className="hover:text-primary transition-colors" title="Emoji">
                    <Smile className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowPollBuilder(v => !v)}
                    title="Add poll"
                    className={`hover:text-primary transition-colors ${showPollBuilder ? "text-primary" : ""}`}
                  >
                    <BarChart className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setAnonMode(!anonMode)}
                    title="Anonymous mode"
                    className={`hover:text-violet-400 transition-colors ${anonMode ? "text-violet-400" : ""}`}
                  >
                    <Ghost className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] font-mono-display opacity-60">
                    {text.length}/2000
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setText(""); setExpanded(false); setShowPollBuilder(false); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || creating}
                    className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    {anonMode ? "Post anonymously" : "Post"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Comment Section ───────────────────────────────────────────────────────

function CommentSection({
  post, onAddComment, onLoad, currentProfile,
}: {
  post: FeedPost;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onLoad: (postId: string) => Promise<void>;
  currentProfile: ReturnType<typeof useAuth>["profile"];
}) {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(async () => {
    if (!loaded) { await onLoad(post.id); setLoaded(true); }
  }, [loaded, onLoad, post.id]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    await onAddComment(post.id, text);
    setText("");
    if (!loaded) setLoaded(true);
  }, [text, onAddComment, post.id, loaded]);

  return (
    <div className="mt-3 space-y-3">
      {!loaded && post.comments_count > 0 && (
        <button onClick={handleLoad} className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
          <ChevronDown className="h-3 w-3" />
          View {post.comments_count} comment{post.comments_count !== 1 ? "s" : ""}
        </button>
      )}

      <AnimatePresence>
        {post.comments.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-2.5"
          >
            <Avatar src={c.author?.avatar_url} handle={c.author?.handle} size="xs" />
            <div className="flex-1 min-w-0">
              <div className="rounded-xl bg-surface px-3 py-2">
                <p className="text-[11px] font-semibold text-foreground mb-0.5">
                  {c.author?.display_name ?? c.author?.handle ?? "user"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5 px-1">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {currentProfile && (
        <div className="flex gap-2.5 items-center">
          <Avatar src={currentProfile.avatar_url} handle={currentProfile.handle} size="xs" />
          <div className="flex-1 flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Add a comment…"
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            {text && (
              <button onClick={handleSubmit} className="text-primary hover:opacity-80 transition-opacity">
                <Send className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────

function PostCard({
  post, onLike, onBookmark, onVote, onAddComment, onLoadComments, currentProfile, onFork,
}: {
  post: FeedPost;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onVote: (postId: string, optionId: string) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onLoadComments: (id: string) => Promise<void>;
  currentProfile: ReturnType<typeof useAuth>["profile"];
  onFork?: (postId: string, text: string, options?: { anonymous?: boolean }) => Promise<boolean>;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showForkModal, setShowForkModal] = useState(false);

  const authorName = post.is_anonymous
    ? "Anonymous"
    : (post.author?.display_name ?? post.author?.handle ?? "user");
  const handle = post.is_anonymous ? null : post.author?.handle;
  const avatarSrc = post.is_anonymous ? null : post.author?.avatar_url;
  const isLong = post.text.length > 280;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-surface/60 backdrop-blur-sm p-4 shadow-card-elevated hover-neon transition-all ${
        post.fork_depth > 0 ? "border-violet-500/30" : "border-border"
      }`}
    >
      {/* Fork indicator */}
      <LocalForkIndicator depth={post.fork_depth} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            {!post.is_anonymous && post.author?.id ? (
              <Link to="/app/profile/$id" params={{ id: post.author.id }}>
                <Avatar src={avatarSrc} handle={handle} size="md" />
              </Link>
            ) : (
              <Avatar src={avatarSrc} handle={post.is_anonymous ? "anonymous" : handle} size="md" />
            )}
            {post.is_anonymous && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-violet-500 border-2 border-background grid place-items-center">
                <Ghost className="h-2 w-2 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {!post.is_anonymous && post.author?.id ? (
                <Link
                  to="/app/profile/$id"
                  params={{ id: post.author.id }}
                  className="text-sm font-semibold truncate hover:text-primary transition-colors"
                >
                  {authorName}
                </Link>
              ) : (
                <span className="text-sm font-semibold truncate">{authorName}</span>
              )}
              {!post.is_anonymous && handle && (
                <span className="text-[11px] text-muted-foreground truncate">@{handle}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {post.intent_tag && (
                <span className={`text-[10px] font-semibold ${INTENT_META[post.intent_tag].color}`}>
                  {INTENT_META[post.intent_tag].emoji} {INTENT_META[post.intent_tag].label}
                </span>
              )}
              <LocalReputationBadge score={post.reputation_score} domain={post.domain_tag} />
              <span className="text-[10px] text-muted-foreground/50">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 mt-0.5">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className={`text-sm text-foreground leading-relaxed whitespace-pre-wrap ${!showMore && isLong ? "line-clamp-5" : ""}`}>
          {post.text}
        </p>
        {isLong && (
          <button
            onClick={() => setShowMore(v => !v)}
            className="text-xs text-primary hover:underline mt-1"
          >
            {showMore ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Poll */}
      {post.poll && (
        <PollWidget poll={post.poll} postId={post.id} onVote={onVote} />
      )}

      {/* Image placeholder */}
      {post.image_url && (
        <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-surface-elevated">
          <img src={post.image_url} alt="Post media" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
        <div className="flex items-center gap-1">
          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              post.is_liked
                ? "bg-pink-500/10 text-pink-400 border border-pink-500/30"
                : "text-muted-foreground hover:text-pink-400 hover:bg-pink-500/10 border border-transparent"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${post.is_liked ? "fill-current" : ""}`} />
            {post.likes_count > 0 && post.likes_count}
          </motion.button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {post.comments_count > 0 && post.comments_count}
          </button>

          {/* Fork/Remix */}
          {onFork && (
            <button 
              onClick={() => setShowForkModal(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 border border-transparent transition-all"
            >
              <Repeat2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Share */}
          <button className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent transition-all">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bookmark */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onBookmark(post.id)}
          className={`rounded-xl px-2.5 py-1.5 border transition-all ${
            post.is_bookmarked
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 border-transparent"
          }`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${post.is_bookmarked ? "fill-current" : ""}`} />
        </motion.button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CommentSection
              post={post}
              onAddComment={onAddComment}
              onLoad={onLoadComments}
              currentProfile={currentProfile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PostFork Modal */}
      {onFork && (
        <PostFork
          post={post}
          onFork={onFork}
          isOpen={showForkModal}
          onClose={() => setShowForkModal(false)}
        />
      )}
    </motion.div>
  );
}

// ── Community Spaces Sidebar ──────────────────────────────────────────────

function SpacesSidebar({ intent }: { intent: IntentMode }) {
  const spaces = COMMUNITY_SPACES.filter(s => intent === "all" || s.intent === intent);

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Radio className="h-3 w-3" />
          Spaces
        </h3>
        <button className="text-[10px] text-primary hover:underline">See all</button>
      </div>
      <div className="space-y-2">
        {(spaces.length > 0 ? spaces : COMMUNITY_SPACES).slice(0, 5).map(space => (
          <motion.button
            key={space.id}
            whileHover={{ x: 3 }}
            className="w-full flex items-center gap-2.5 rounded-xl border border-border/50 bg-surface/40 px-3 py-2.5 text-left hover:border-primary/30 hover:bg-surface transition-all"
          >
            <span className="text-xl leading-none shrink-0">{space.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold truncate">{space.name}</p>
                {space.isLive && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-1.5 py-0.5 shrink-0">
                    <span className="h-1 w-1 rounded-full bg-red-400 animate-pulse-glow" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{space.topic}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/50 shrink-0 font-mono-display">
              {space.members >= 1000 ? `${(space.members / 1000).toFixed(1)}k` : space.members}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── Trending Sidebar ──────────────────────────────────────────────────────

function TrendingSidebar() {
  const trending = [
    { tag: "NEXUS2026",       posts: "12.4k", hot: true },
    { tag: "AfricanTech",     posts: "8.1k",  hot: true },
    { tag: "AITwinLaunch",    posts: "6.7k",  hot: false },
    { tag: "BuildInPublic",   posts: "4.2k",  hot: false },
    { tag: "CreatorEconomy",  posts: "3.9k",  hot: false },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
        <TrendingUp className="h-3 w-3" />
        Trending
      </h3>
      <div className="space-y-2">
        {trending.map((t, i) => (
          <button key={t.tag} className="w-full flex items-center justify-between rounded-lg hover:bg-surface transition-colors px-2 py-1.5 group">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-display text-muted-foreground/50 w-4">{i + 1}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold group-hover:text-primary transition-colors">#{t.tag}</span>
                  {t.hot && <Flame className="h-3 w-3 text-orange-400" />}
                </div>
                <p className="text-[10px] text-muted-foreground">{t.posts} posts</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Who to Follow ─────────────────────────────────────────────────────────

function WhoToFollow() {
  const suggestions = [
    { handle: "aryan_nexus",    name: "Aryan K.",      domain: "Engineering", score: 94, seed: "aryan" },
    { handle: "amara_creates",  name: "Amara L.",      domain: "Design",      score: 88, seed: "amara" },
    { handle: "zeynep_labs",    name: "Zeynep A.",     domain: "AI Research", score: 91, seed: "zeynep" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          Who to follow
        </h3>
      </div>
      <div className="space-y-3">
        {suggestions.map(s => (
          <div key={s.handle} className="flex items-center gap-2.5">
            <Avatar src={`https://api.dicebear.com/8.x/identicon/svg?seed=${s.seed}&backgroundColor=0f172a`} handle={s.handle} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{s.name}</p>
              <LocalReputationBadge score={s.score} domain={s.domain} />
            </div>
            <button className="text-[10px] font-semibold text-primary hover:underline shrink-0">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Twin Bar ───────────────────────────────────────────────────────────

function AITwinBar({ intent }: { intent: IntentMode }) {
  const [dismissed, setDismissed] = useState(false);
  const suggestions: Partial<Record<IntentMode, string>> = {
    learn:   "Based on your history, you might enjoy a thread on distributed systems in Africa.",
    chill:   "Your twin noticed you often unwind with lo-fi design posts on Friday evenings.",
    create:  "3 creators in your network just shared new work. Want a curated summary?",
    explore: "Two trending spaces about East African tech scenes appeared in the last hour.",
    shop:    "Your cart has 2 items. Prices dropped on both since yesterday.",
  };
  const msg = suggestions[intent];
  if (!msg || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-3"
    >
      <Sparkles className="h-4 w-4 text-violet-400 shrink-0 animate-pulse-glow" />
      <p className="text-xs text-muted-foreground flex-1">{msg}</p>
      <button className="text-[10px] font-semibold text-violet-400 hover:underline shrink-0">Show me</button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground/40 hover:text-muted-foreground">
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────

function EmptyFeed({ intent }: { intent: IntentMode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">{INTENT_META[intent].emoji}</div>
      <h3 className="text-lg font-semibold mb-2">
        No {intent !== "all" ? INTENT_META[intent].label + " " : ""}posts yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {intent === "all"
          ? "Be the first to post. Your words start the feed."
          : `No "${INTENT_META[intent].label}" content yet. Switch intent or create a post.`}
      </p>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-surface-elevated" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-28 rounded bg-surface-elevated" />
          <div className="h-2.5 w-20 rounded bg-surface-elevated" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-surface-elevated" />
        <div className="h-3 w-4/5 rounded bg-surface-elevated" />
        <div className="h-3 w-3/5 rounded bg-surface-elevated" />
      </div>
      <div className="flex gap-2 pt-2 border-t border-border/50">
        <div className="h-7 w-16 rounded-xl bg-surface-elevated" />
        <div className="h-7 w-16 rounded-xl bg-surface-elevated" />
        <div className="h-7 w-16 rounded-xl bg-surface-elevated" />
      </div>
    </div>
  );
}

// ── Main SocialFeed ───────────────────────────────────────────────────────

export function SocialFeed() {
  const { user, profile } = useAuth();
  const {
    posts, stories, intent, setIntent, loading, creating,
    anonMode, setAnonMode,
    toggleLike, toggleBookmark, votePoll,
    addComment, loadComments, createPost, refresh,
  } = useSocialFeed();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-[61px] z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold leading-tight">Social Feed</h1>
              <p className="text-[10px] text-muted-foreground font-mono-display">
                Intent-first · No rage-bait · 80% creator rev
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Anonymous mode toggle */}
              <button
                onClick={() => setAnonMode(!anonMode)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  anonMode
                    ? "bg-violet-500/10 border-violet-500/40 text-violet-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Ghost className="h-3 w-3" />
                {anonMode ? "Anon ON" : "Anon"}
              </button>
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
          </div>
          <IntentBar intent={intent} setIntent={setIntent} />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ── Feed column ── */}
          <div className="space-y-4 min-w-0">

            {/* Stories */}
            {stories.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface/60 p-4">
                <Stories 
                  stories={stories} 
                  currentUserId={user?.id}
                  onView={(storyId) => {
                    console.log("Story viewed:", storyId);
                  }}
                />
              </div>
            )}

            {/* AI Twin bar */}
            <AnimatePresence>
              {user && <AITwinBar intent={intent} />}
            </AnimatePresence>

            {/* Composer */}
            {user && profile && (
              <PostComposer
                profile={profile}
                onPost={createPost}
                creating={creating}
                intent={intent}
                anonMode={anonMode}
                setAnonMode={setAnonMode}
              />
            )}

            {/* Feed */}
            {loading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <PostSkeleton key={i} />)}</div>
            ) : posts.length === 0 ? (
              <EmptyFeed intent={intent} />
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={toggleLike}
                    onBookmark={toggleBookmark}
                    onVote={votePoll}
                    onAddComment={addComment}
                    onLoadComments={loadComments}
                    currentProfile={profile}
                    onFork={async (postId, text, options) => {
                      console.log("Fork post:", postId, text, options);
                      return true;
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Sidebar column ── */}
          <div className="hidden lg:block">
            <div className="sticky top-[140px] space-y-4">
              <CommunitySpaces intent={intent} />
              <TrendingTopics 
                onTopicClick={(tag) => {
                  console.log("Topic clicked:", tag);
                }}
              />
              <WhoToFollow />

              {/* Privacy notice */}
              <div className="rounded-xl border border-border/50 bg-surface/30 p-3">
                <div className="flex items-start gap-2">
                  <Lock className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                    Feed ranked by declared intent. No engagement bait. No third-party tracking.
                    <span className="block mt-1 text-primary cursor-pointer hover:underline">View algorithm →</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
