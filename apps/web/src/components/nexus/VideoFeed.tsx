import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
  Bookmark,
  Users,
  Zap,
  Radio,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { VideoPlayer } from "@/components/nexus/VideoPlayer";
import { useVideoDiscovery } from "@/hooks/use-video-discovery";
import { useVideoSocial, type VideoComment } from "@/hooks/use-video-social";

/** Mood/intent filter — mirrors the blueprint's Intent-First Feed */
const MOODS = [
  { id: "all", label: "All", emoji: "✦" },
  { id: "chill", label: "Chill", emoji: "🌊" },
  { id: "learn", label: "Learn", emoji: "🔬" },
  { id: "explore", label: "Explore", emoji: "🌍" },
  { id: "create", label: "Create", emoji: "🎨" },
] as const;
type Mood = (typeof MOODS)[number]["id"];

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function VideoFeed() {
  const [mood, setMood] = useState<Mood>("all");
  const { videos, hasMore, isLoading, error, loadMore, removeVideo } = useVideoDiscovery({
    batchSize: 6,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [direction, setDirection] = useState(0);
  const [aspectRatioById, setAspectRatioById] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showMoodBar, setShowMoodBar] = useState(false);
  const [watchPartyActive, setWatchPartyActive] = useState(false);
  const touchStartY = useRef(0);

  const currentVideo = videos[currentIndex] ?? null;
  const currentAspectRatio = currentVideo ? (aspectRatioById[currentVideo.id] ?? null) : null;

  const videoSocial = useVideoSocial(currentVideo?.id ?? "");

  const goToIndex = (next: number) => {
    if (!videos.length) return;
    if (next === currentIndex || next < 0 || next >= videos.length) return;
    setDirection(next > currentIndex ? 1 : -1);
    setCurrentIndex(next);
    setShowComments(false);
  };

  const goNext = () => goToIndex(currentIndex + 1);
  const goPrevious = () => goToIndex(currentIndex - 1);

  // Prefetch next batch
  useEffect(() => {
    const remaining = videos.length - currentIndex - 1;
    if (hasMore && !isLoading && remaining <= 2) void loadMore();
  }, [currentIndex, hasMore, isLoading, videos.length]);

  useEffect(() => {
    if (currentIndex >= videos.length) setCurrentIndex(Math.max(0, videos.length - 1));
  }, [videos.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") goNext();
      else if (e.key === "ArrowUp") goPrevious();
      else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((v) => !v);
      } else if (e.key.toLowerCase() === "m") setIsMuted((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, videos.length]);

  useEffect(() => {
    setIsPlaying(true);
  }, [currentIndex]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 60) {
      if (delta > 0) goNext();
      else goPrevious();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) goNext();
    else goPrevious();
  };

  const mediaClass = useMemo(() => {
    if (!currentAspectRatio) return "h-full w-full object-cover";
    return currentAspectRatio < 0.95
      ? "h-full w-full object-cover"
      : "h-full w-full object-contain";
  }, [currentAspectRatio]);

  if (!currentVideo) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-500/60 animate-pulse" />
          <Zap className="absolute inset-0 m-auto h-6 w-6 text-cyan-400" />
        </div>
        <p className="text-lg font-semibold">Discovering content…</p>
        <p className="text-sm text-white/50">ScyllaDB · AV1 pipeline · Global CDN</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  const { liked, likeCount, commentCount } = videoSocial;

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-black select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentVideo.id}
          custom={direction}
          initial={{ y: direction > 0 ? "100%" : "-100%", opacity: 0.4 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction > 0 ? "-100%" : "100%", opacity: 0.4 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          {/* ── Video ─────────────────────────────────────────────────── */}
          <div className="absolute inset-0 bg-black">
            <VideoPlayer
              sources={currentVideo.kind === "youtube" ? [] : currentVideo.sources}
              embedUrl={currentVideo.embedUrl}
              poster={currentVideo.poster}
              className={mediaClass}
              fill
              autoPlay={isPlaying}
              loop
              muted={isMuted}
              preload="auto"
              showPerfHud={false}
              onClick={() => setIsPlaying((v) => !v)}
              onMetadata={({ aspectRatio }) =>
                setAspectRatioById((p) =>
                  p[currentVideo.id] === aspectRatio ? p : { ...p, [currentVideo.id]: aspectRatio },
                )
              }
              onPlaybackFailed={() => removeVideo(currentVideo.id)}
            />
          </div>

          {/* ── Gradients ─────────────────────────────────────────────── */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>

          {/* ── Play/Pause tap overlay ─────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setIsPlaying((v) => !v)}
            className="absolute inset-0 flex items-center justify-center"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-full bg-black/40 p-5 backdrop-blur"
                >
                  <Play className="h-10 w-10 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* ── Top bar ───────────────────────────────────────────────── */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-safe-top z-10">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-black/40 px-3 py-1 backdrop-blur">
                <span className="text-xs font-bold tracking-widest text-white">NEXUS</span>
                <span className="ml-1.5 text-xs font-bold text-cyan-400">Feed</span>
              </div>
              {/* Mood bar toggle */}
              <button
                type="button"
                onClick={() => setShowMoodBar((v) => !v)}
                className="rounded-full bg-black/40 px-2.5 py-1 text-xs text-white/70 backdrop-blur hover:text-white"
              >
                {MOODS.find((m) => m.id === mood)?.emoji} Intent
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* Watch Together indicator */}
              <button
                type="button"
                onClick={() => setWatchPartyActive((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs backdrop-blur transition-all ${
                  watchPartyActive
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                    : "bg-black/40 text-white/60 hover:text-white"
                }`}
              >
                <Users className="h-3 w-3" />
                {watchPartyActive ? "Party ON" : "Watch Together"}
              </button>
              <div className="rounded-full bg-black/40 px-2 py-1 font-mono text-[10px] text-white/50 backdrop-blur">
                {currentIndex + 1}/{videos.length}
              </div>
            </div>
          </div>

          {/* ── Mood bar ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {showMoodBar && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-4 right-4 top-14 z-20 flex gap-2 overflow-x-auto pb-1"
              >
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMood(m.id);
                      setShowMoodBar(false);
                    }}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur transition-all ${
                      mood === m.id
                        ? "bg-cyan-500 text-black"
                        : "bg-black/50 text-white/80 border border-white/10 hover:border-white/30"
                    }`}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Watch Together overlay ────────────────────────────────── */}
          <AnimatePresence>
            {watchPartyActive && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-14 top-20 z-20 w-44 rounded-xl border border-cyan-500/30 bg-black/70 p-3 backdrop-blur-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-cyan-300">Watch Together</span>
                </div>
                <div className="space-y-1.5">
                  {["@you", "@alex_nexus", "@priya.m"].map((u, i) => (
                    <div key={u} className="flex items-center gap-2">
                      <div
                        className={`h-5 w-5 rounded-full text-[9px] flex items-center justify-center font-bold ${
                          i === 0 ? "bg-cyan-500 text-black" : "bg-white/20 text-white"
                        }`}
                      >
                        {u[1].toUpperCase()}
                      </div>
                      <span className="text-[11px] text-white/70">{u}</span>
                      {i === 0 && <span className="ml-auto text-[9px] text-cyan-400">host</span>}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-white/40">Synced · 0ms drift</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Right action bar ──────────────────────────────────────── */}
          <div className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentVideo.author)}`}
                alt={currentVideo.author}
                className="h-10 w-10 rounded-full border-2 border-white object-cover"
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 p-0.5">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
              </div>
            </div>

            {/* Like */}
            <button
              type="button"
              onClick={() => videoSocial.toggleLike()}
              className="flex flex-col items-center gap-1 group"
            >
              <motion.div
                whileTap={{ scale: 1.4 }}
                className="rounded-full bg-black/30 p-2 backdrop-blur"
              >
                <Heart
                  className={`h-7 w-7 transition-all ${liked ? "text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-white group-hover:text-red-400"}`}
                />
              </motion.div>
              <span className="text-xs font-semibold text-white drop-shadow">
                {formatCount(likeCount)}
              </span>
            </button>

            {/* Comments */}
            <button
              type="button"
              onClick={() => setShowComments((v) => !v)}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className={`rounded-full p-2 backdrop-blur transition-all ${showComments ? "bg-cyan-500/30" : "bg-black/30 group-hover:bg-black/50"}`}
              >
                <MessageCircle
                  className={`h-7 w-7 ${showComments ? "text-cyan-300" : "text-white"}`}
                />
              </div>
              <span className="text-xs font-semibold text-white drop-shadow">
                {formatCount(commentCount)}
              </span>
            </button>

            {/* Save */}
            <button
              type="button"
              onClick={() =>
                setSavedIds((p) => {
                  const next = new Set(p);
                  if (next.has(currentVideo.id)) {
                    next.delete(currentVideo.id);
                  } else {
                    next.add(currentVideo.id);
                  }
                  return next;
                })
              }
              className="flex flex-col items-center gap-1 group"
            >
              <div className="rounded-full bg-black/30 p-2 backdrop-blur">
                <Bookmark
                  className={`h-7 w-7 transition-all ${savedIds.has(currentVideo.id) ? "text-yellow-400 fill-yellow-400" : "text-white group-hover:text-yellow-300"}`}
                />
              </div>
              <span className="text-xs font-semibold text-white drop-shadow">Save</span>
            </button>

            {/* Share */}
            <button type="button" className="flex flex-col items-center gap-1 group">
              <div className="rounded-full bg-black/30 p-2 backdrop-blur">
                <Share2 className="h-7 w-7 text-white group-hover:text-cyan-300 transition-colors" />
              </div>
              <span className="text-xs font-semibold text-white drop-shadow">Share</span>
            </button>

            {/* Mute */}
            <button
              type="button"
              onClick={() => setIsMuted((v) => !v)}
              className="rounded-full bg-black/30 p-2 backdrop-blur"
            >
              {isMuted ? (
                <VolumeX className="h-6 w-6 text-white/70" />
              ) : (
                <Volume2 className="h-6 w-6 text-white" />
              )}
            </button>

            {/* More */}
            <button type="button" className="rounded-full bg-black/30 p-2 backdrop-blur">
              <MoreHorizontal className="h-5 w-5 text-white/60" />
            </button>
          </div>

          {/* ── Video metadata ────────────────────────────────────────── */}
          <div className="absolute bottom-16 left-4 right-20 z-10 text-white">
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-widest text-white/50">
              <span className="rounded-full border border-white/20 px-2 py-0.5">
                {currentVideo.category}
              </span>
              <span>{currentVideo.durationLabel}</span>
              <span>·</span>
              <span>{currentVideo.provider}</span>
              {mood !== "all" && (
                <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-cyan-300">
                  {MOODS.find((m) => m.id === mood)?.emoji} {mood}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-white/80">@{currentVideo.author}</p>
            <h3 className="mt-0.5 text-base font-bold leading-tight">{currentVideo.title}</h3>
            <p className="mt-1.5 line-clamp-2 text-sm text-white/70">{currentVideo.description}</p>
          </div>

          {/* ── Comments drawer ───────────────────────────────────────── */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-white/10 bg-black/90 backdrop-blur-xl"
                style={{ maxHeight: "55vh" }}
              >
                <div className="flex h-1 w-12 rounded-full bg-white/20 mx-auto mt-3" />
                <div className="flex items-center justify-between px-4 py-3">
                  <h4 className="font-semibold text-white">Comments ({commentCount})</h4>
                  <button
                    onClick={() => setShowComments(false)}
                    className="text-white/50 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div
                  className="overflow-y-auto px-4 pb-2 space-y-2"
                  style={{ maxHeight: "calc(55vh - 120px)" }}
                >
                  {videoSocial.comments.map((c: VideoComment) => (
                    <div key={c.id} className="rounded-xl bg-white/5 px-3 py-2 group/comment">
                      <p className="text-sm text-white/90">{c.text}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-[10px] text-white/40">
                          {videoSocial.isLoggedIn && c.userId === videoSocial.anchor?.id
                            ? "You"
                            : "Member"}{" "}
                          ·{" "}
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {videoSocial.isLoggedIn && (
                          <button
                            type="button"
                            onClick={() => videoSocial.deleteComment(c.id)}
                            className="opacity-0 group-hover/comment:opacity-100 text-[10px] text-white/30 hover:text-red-400 transition-all"
                          >
                            delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {videoSocial.comments.length === 0 && (
                    <p className="py-6 text-center text-sm text-white/40">No comments yet.</p>
                  )}
                </div>
                <div className="flex gap-2 border-t border-white/10 px-4 py-3">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentInput.trim()) {
                        void videoSocial.addComment(commentInput.trim());
                        setCommentInput("");
                      }
                    }}
                    placeholder={videoSocial.isLoggedIn ? "Add a comment…" : "Sign in to comment"}
                    disabled={!videoSocial.isLoggedIn}
                    className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled={!videoSocial.isLoggedIn || !commentInput.trim()}
                    onClick={() => {
                      if (commentInput.trim()) {
                        void videoSocial.addComment(commentInput.trim());
                        setCommentInput("");
                      }
                    }}
                    className="rounded-full bg-cyan-500 p-2 text-black disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Progress bar ──────────────────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / Math.max(videos.length, 1)) * 100}%` }}
            />
          </div>

          {/* ── Status toasts ─────────────────────────────────────────── */}
          {isLoading && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/60 backdrop-blur">
              {isLoading ? "Buffering…" : "Loading next batch"}
            </div>
          )}
          {error && (
            <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded-md bg-red-500/20 px-3 py-2 text-xs text-red-200 backdrop-blur">
              {error}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
