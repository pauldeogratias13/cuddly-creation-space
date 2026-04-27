import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
import { DEMO_VIDEOS, DemoVideo } from "@/lib/demo-videos";
import { Heart, MessageCircle, Share2, Pause, Play, Volume2, VolumeX } from "lucide-react";

export function VideoFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [direction, setDirection] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const hlsRefs = useRef<(Hls | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const preloadRefs = useRef<Set<number>>(new Set());

  const currentVideo = DEMO_VIDEOS[currentIndex];

  // Initialize video with HLS adaptive streaming (NEXUS Blueprint Sec.07)
  const initVideo = useCallback((video: HTMLVideoElement, index: number) => {
    if (!video || hlsRefs.current[index]) return;

    const videoData = DEMO_VIDEOS[index];
    if (!videoData) return;

    // HLS.js adaptive bitrate streaming
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRefs.current[index] = hls;

      // For demo MP4s, load directly; for HLS streams, use HLS.js
      if (videoData.url.includes(".m3u8")) {
        hls.loadSource(videoData.url);
        hls.attachMedia(video);
      } else {
        video.src = videoData.url;
      }

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (index === currentIndex && isPlaying) {
          video.play().catch(() => {});
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoData.url;
    } else {
      video.src = videoData.url;
    }
  }, [currentIndex, isPlaying]);

  // Intersection Observer for preloading adjacent videos (NEXUS Blueprint: preload buffer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting && !preloadRefs.current.has(idx)) {
            preloadRefs.current.add(idx);
            const video = videoRefs.current[idx];
            if (video) {
              initVideo(video, idx);
            }
          }
        });
      },
      { root: containerRef.current, threshold: 0.1, rootMargin: "200px" }
    );

    // Observe next 2 videos for preloading
    for (let i = currentIndex; i < Math.min(currentIndex + 3, DEMO_VIDEOS.length); i++) {
      const el = videoRefs.current[i];
      if (el && !preloadRefs.current.has(i)) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, [currentIndex, initVideo]);

  // Manage current video playback
  useEffect(() => {
    // Pause all except current
    DEMO_VIDEOS.forEach((_, idx) => {
      const video = videoRefs.current[idx];
      if (video) {
        if (idx === currentIndex) {
          if (isPlaying) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, isPlaying]);

  // Initialize current video if not already
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (video && !preloadRefs.current.has(currentIndex)) {
      initVideo(video, currentIndex);
    }
  }, [currentIndex, initVideo]);

  const handleScroll = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0 && currentIndex < DEMO_VIDEOS.length - 1) {
        setDirection(1);
        setCurrentIndex((prev) => Math.min(prev + 1, DEMO_VIDEOS.length - 1));
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setDirection(-1);
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    },
    [currentIndex]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.target as HTMLElement).dataset.touchStartY = touch.clientY.toString();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const startY = Number((e.target as HTMLElement).dataset.touchStartY || 0);
    const deltaY = startY - touch.clientY;
    if (deltaY > 50 && currentIndex < DEMO_VIDEOS.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => Math.min(prev + 1, DEMO_VIDEOS.length - 1));
    } else if (deltaY < -50 && currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const togglePlay = () => setIsPlaying((p) => !p);
  const toggleMute = () => setIsMuted((p) => !p);

  const formatCount = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          initial={{ y: direction > 0 ? "100%" : "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction > 0 ? "-100%" : "100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <video
            ref={(el) => {
              videoRefs.current[currentIndex] = el;
            }}
            className="h-full w-full object-cover"
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            {isPlaying ? (
              <Pause className="h-16 w-16 text-white/70" />
            ) : (
              <Play className="h-16 w-16 text-white/70" />
            )}
          </button>

          {/* Right side actions */}
          <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
            <button className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                <img
                  src={currentVideo.avatar}
                  alt=""
                  className="h-9 w-9 rounded-full border-2 border-white"
                />
              </div>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <Heart className="h-8 w-8 text-white group-hover:text-red-500 transition-colors" />
              <span className="text-xs text-white font-semibold">
                {formatCount(currentVideo.likes)}
              </span>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <MessageCircle className="h-8 w-8 text-white group-hover:text-blue-400 transition-colors" />
              <span className="text-xs text-white font-semibold">
                {formatCount(currentVideo.comments)}
              </span>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <Share2 className="h-8 w-8 text-white group-hover:text-green-400 transition-colors" />
              <span className="text-xs text-white font-semibold">
                {formatCount(currentVideo.shares)}
              </span>
            </button>

            <button onClick={toggleMute} className="flex flex-col items-center gap-1">
              {isMuted ? (
                <VolumeX className="h-7 w-7 text-white" />
              ) : (
                <Volume2 className="h-7 w-7 text-white" />
              )}
            </button>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-20 left-3 right-16 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-sm">@{currentVideo.author}</span>
            </div>
            <h3 className="text-base font-semibold mb-1">{currentVideo.title}</h3>
            <p className="text-sm text-white/80 line-clamp-2">{currentVideo.description}</p>
          </div>

          {/* Progress indicator */}
          <div className="absolute top-4 right-3 text-white/60 text-xs font-mono">
            {currentIndex + 1} / {DEMO_VIDEOS.length}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / DEMO_VIDEOS.length) * 100}%` }}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* NEXUS Feed Header */}
      <div className="absolute top-4 left-4 z-10">
        <h2 className="text-white font-bold text-xl tracking-tight">
          <span className="text-gradient-aurora">NEXUS</span> Feed
        </h2>
      </div>
    </div>
  );
}
