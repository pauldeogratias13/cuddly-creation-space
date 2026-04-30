import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { VideoPlayer } from "@/components/nexus/VideoPlayer";
import { useVideoDiscovery } from "@/hooks/use-video-discovery";
import { useVideoSocial } from "@/hooks/use-video-social";

export function VideoFeed() {
  const { videos, hasMore, isLoading, error, loadMore, removeVideo } = useVideoDiscovery({
    batchSize: 6,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [direction, setDirection] = useState(0);
  const [aspectRatioById, setAspectRatioById] = useState<Record<string, number>>({});

  const currentVideo = videos[currentIndex] ?? null;
  const currentAspectRatio = currentVideo ? aspectRatioById[currentVideo.id] ?? null : null;

  // Social functionality for current video
  const videoSocial = useVideoSocial(currentVideo?.id || "");
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  // Create a default post for the video when it loads if none exists
  useEffect(() => {
    if (currentVideo && videoSocial.posts.length === 0 && !videoSocial.loading) {
      videoSocial.createPost(`Check out this amazing video: ${currentVideo.title}`).catch(console.error);
    }
  }, [currentVideo, videoSocial.posts.length, videoSocial.loading]);

  const goToIndex = (nextIndex: number) => {
    if (!videos.length) return;
    if (nextIndex === currentIndex || nextIndex < 0 || nextIndex >= videos.length) return;
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setCurrentIndex(nextIndex);
  };

  const goNext = () => goToIndex(currentIndex + 1);
  const goPrevious = () => goToIndex(currentIndex - 1);

  useEffect(() => {
    const remaining = videos.length - currentIndex - 1;
    if (hasMore && !isLoading && remaining <= 3) {
      void loadMore();
    }
  }, [currentIndex, hasMore, isLoading, loadMore, videos.length]);

  useEffect(() => {
    if (currentIndex < videos.length) return;
    setCurrentIndex(Math.max(0, videos.length - 1));
  }, [currentIndex, videos.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") goNext();
      if (event.key === "ArrowUp") goPrevious();
      if (event.key === " ") {
        event.preventDefault();
        setIsPlaying((value) => !value);
      }
      if (event.key.toLowerCase() === "m") {
        setIsMuted((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex, videos.length]);

  useEffect(() => {
    setIsPlaying(true);
  }, [currentIndex]);

  const handleScroll = (event: React.WheelEvent) => {
    event.preventDefault();
    if (event.deltaY > 0) goNext();
    if (event.deltaY < 0) goPrevious();
  };

  const formatCount = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const mediaClassName = useMemo(() => {
    if (!currentAspectRatio) return "h-full w-full object-cover";
    return currentAspectRatio < 0.95 ? "h-full w-full object-cover" : "h-full w-full object-contain";
  }, [currentAspectRatio]);

  if (!currentVideo) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black px-6 text-center text-white">
        <div className="space-y-3">
          <p className="text-lg font-semibold">Searching the web for playable videos…</p>
          <p className="text-sm text-white/70">
            We only keep URLs that respond like real videos and can load in the player.
          </p>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black" onWheel={handleScroll}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentVideo.id}
          custom={direction}
          initial={{ y: direction > 0 ? "100%" : "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction > 0 ? "-100%" : "100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <VideoPlayer
              sources={currentVideo.kind === "youtube" ? [] : currentVideo.sources}
              embedUrl={currentVideo.embedUrl}
              poster={currentVideo.poster}
              className={`absolute inset-0 h-full w-full ${
                currentAspectRatio && currentAspectRatio < 0.95 ? "object-cover" : "object-contain"
              }`}
              autoPlay={isPlaying}
              loop
              muted={isMuted}
              preload="auto"
              fill
              onClick={() => setIsPlaying((value) => !value)}
              onMetadata={({ aspectRatio }) => {
                setAspectRatioById((prev) =>
                  prev[currentVideo.id] === aspectRatio ? prev : { ...prev, [currentVideo.id]: aspectRatio },
                );
              }}
              onPlaybackFailed={() => {
                const failedId = currentVideo.id;
                removeVideo(failedId);
              }}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />

          <button
            type="button"
            onClick={() => setIsPlaying((value) => !value)}
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100"
          >
            {isPlaying ? (
              <Pause className="h-16 w-16 text-white/75" />
            ) : (
              <Play className="h-16 w-16 text-white/75" />
            )}
          </button>

          <div className="absolute left-4 top-4 z-10 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            NEXUS Feed
          </div>

          <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3">
            <button
              type="button"
              onClick={goPrevious}
              disabled={currentIndex === 0}
              className="rounded-full bg-black/35 p-2 text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous video"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === videos.length - 1 && !hasMore}
              className="rounded-full bg-black/35 p-2 text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next video"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentVideo.author)}`}
                  alt={`${currentVideo.author} avatar`}
                  className="h-9 w-9 rounded-full border-2 border-white"
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => {
                if (currentVideo && videoSocial.posts.length > 0) {
                  videoSocial.toggleLike(videoSocial.posts[0]);
                }
              }}
              className="flex flex-col items-center gap-1"
            >
              <Heart 
                className={`h-8 w-8 transition-colors ${
                  videoSocial.posts.length > 0 && videoSocial.posts[0].liked 
                    ? "text-red-500 fill-red-500" 
                    : "text-white hover:text-red-500"
                }`} 
              />
              <span className="text-xs font-semibold text-white">
                {formatCount(videoSocial.totalLikes)}
              </span>
            </button>

            <button 
              type="button" 
              onClick={() => setShowComments(!showComments)}
              className="flex flex-col items-center gap-1"
            >
              <MessageCircle className="h-8 w-8 text-white transition-colors hover:text-blue-400" />
              <span className="text-xs font-semibold text-white">
                {formatCount(videoSocial.totalComments)}
              </span>
            </button>

            <button type="button" className="flex flex-col items-center gap-1">
              <Share2 className="h-8 w-8 text-white transition-colors hover:text-green-400" />
              <span className="text-xs font-semibold text-white">
                Share
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((value) => !value)}
              className="flex flex-col items-center gap-1"
            >
              {isMuted ? (
                <VolumeX className="h-7 w-7 text-white" />
              ) : (
                <Volume2 className="h-7 w-7 text-white" />
              )}
            </button>
          </div>

          <div className="absolute bottom-16 left-4 right-20 text-white">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
              <span>{currentVideo.category}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{currentVideo.durationLabel}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{currentVideo.provider}</span>
            </div>
            <p className="text-sm font-semibold">@{currentVideo.author}</p>
            <h3 className="mt-1 text-xl font-semibold">{currentVideo.title}</h3>
            <p className="mt-2 max-w-xl text-sm text-white/80">{currentVideo.description}</p>
            <p className="mt-3 break-all text-xs text-white/55">{currentVideo.pageUrl}</p>
          </div>

          <div className="absolute right-3 top-4 text-xs font-mono text-white/65">
            {currentIndex + 1} / {videos.length}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / Math.max(videos.length, 1)) * 100}%` }}
            />
          </div>

          {(isLoading || hasMore) && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-white/75 backdrop-blur">
              {isLoading ? "Loading more verified videos…" : "Buffering next discovery batch"}
            </div>
          )}
          {error && (
            <div className="absolute left-1/2 top-16 -translate-x-1/2 rounded-md bg-red-500/20 px-3 py-2 text-xs text-red-100 backdrop-blur">
              {error}
            </div>
          )}

          {/* Comments Section */}
          {showComments && (
            <div className="absolute bottom-0 left-0 right-0 max-h-96 bg-black/90 backdrop-blur-lg border-t border-white/20">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold">Comments ({videoSocial.totalComments})</h4>
                  <button
                    onClick={() => setShowComments(false)}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Add Comment */}
                <div className="flex gap-2">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && commentInput.trim()) {
                        e.preventDefault();
                        if (videoSocial.posts.length > 0) {
                          videoSocial.addComment(videoSocial.posts[0].id, commentInput.trim());
                          setCommentInput("");
                        }
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-white/10 text-white placeholder-white/50 px-3 py-2 rounded-lg text-sm border border-white/20 focus:border-white/40 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (commentInput.trim() && videoSocial.posts.length > 0) {
                        videoSocial.addComment(videoSocial.posts[0].id, commentInput.trim());
                        setCommentInput("");
                      }
                    }}
                    className="bg-primary px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Post
                  </button>
                </div>

                {/* Comments List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {videoSocial.comments.map((comment) => (
                    <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-white/90 text-sm">{comment.text}</p>
                          <p className="text-white/50 text-xs mt-1">
                            {comment.userId === "current-user" ? "You" : "User"} · 
                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {videoSocial.comments.length === 0 && (
                    <p className="text-white/40 text-center py-4">No comments yet. Be the first!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
