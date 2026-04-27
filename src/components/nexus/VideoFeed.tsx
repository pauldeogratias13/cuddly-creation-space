import { useEffect, useState } from "react";
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
import { DEMO_VIDEOS } from "@/lib/demo-videos";
import { VideoPlayer } from "@/components/nexus/VideoPlayer";

export function VideoFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [direction, setDirection] = useState(0);

  const currentVideo = DEMO_VIDEOS[currentIndex];

  const goToIndex = (nextIndex: number) => {
    if (nextIndex === currentIndex || nextIndex < 0 || nextIndex >= DEMO_VIDEOS.length) return;
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setCurrentIndex(nextIndex);
  };

  const goNext = () => goToIndex(currentIndex + 1);
  const goPrevious = () => goToIndex(currentIndex - 1);

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
  }, [currentIndex]);

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
          <VideoPlayer
            sources={currentVideo.sources}
            poster={currentVideo.poster}
            className="h-full w-full object-cover"
            autoPlay={isPlaying}
            loop
            muted={isMuted}
            preload="auto"
            onClick={() => setIsPlaying((value) => !value)}
          />

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
              disabled={currentIndex === DEMO_VIDEOS.length - 1}
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
                  src={currentVideo.avatar}
                  alt={`${currentVideo.author} avatar`}
                  className="h-9 w-9 rounded-full border-2 border-white"
                />
              </div>
            </div>

            <button type="button" className="flex flex-col items-center gap-1">
              <Heart className="h-8 w-8 text-white transition-colors hover:text-red-500" />
              <span className="text-xs font-semibold text-white">
                {formatCount(currentVideo.likes)}
              </span>
            </button>

            <button type="button" className="flex flex-col items-center gap-1">
              <MessageCircle className="h-8 w-8 text-white transition-colors hover:text-blue-400" />
              <span className="text-xs font-semibold text-white">
                {formatCount(currentVideo.comments)}
              </span>
            </button>

            <button type="button" className="flex flex-col items-center gap-1">
              <Share2 className="h-8 w-8 text-white transition-colors hover:text-green-400" />
              <span className="text-xs font-semibold text-white">
                {formatCount(currentVideo.shares)}
              </span>
            </button>

            <button type="button" onClick={() => setIsMuted((value) => !value)} className="flex flex-col items-center gap-1">
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
            </div>
            <p className="text-sm font-semibold">@{currentVideo.author}</p>
            <h3 className="mt-1 text-xl font-semibold">{currentVideo.title}</h3>
            <p className="mt-2 max-w-xl text-sm text-white/80">{currentVideo.description}</p>
            <p className="mt-3 text-xs text-white/55">
              Use mouse wheel, swipe, or arrow keys to move through the feed. Press M to mute.
            </p>
          </div>

          <div className="absolute right-3 top-4 text-xs font-mono text-white/65">
            {currentIndex + 1} / {DEMO_VIDEOS.length}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / DEMO_VIDEOS.length) * 100}%` }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
