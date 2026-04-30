import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AlertCircle, LoaderCircle, RefreshCcw, Wifi, Zap } from "lucide-react";

type VideoPlayerProps = {
  sources: string[];
  embedUrl?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
  fill?: boolean;
  onClick?: () => void;
  onPlaybackReady?: () => void;
  onPlaybackFailed?: () => void;
  onMetadata?: (payload: { width: number; height: number; aspectRatio: number }) => void;
  onAllSourcesFailed?: () => void;
  onDimensions?: (dims: { width: number; height: number; aspectRatio: number }) => void;
  initialAspectRatio?: number;
  emptyLabel?: string;
  /** Show NEXUS performance indicators (CDN node, buffer health) */
  showPerfHud?: boolean;
};

/** Convert any YouTube URL variant → privacy-enhanced embed URL with params */
function buildYouTubeEmbedSrc(
  raw: string,
  opts: { autoPlay: boolean; muted: boolean; loop: boolean },
): string {
  try {
    const url = new URL(raw);
    let videoId: string | null = null;

    if (url.hostname.includes("youtube.com") && url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (url.hostname === "youtu.be") {
      videoId = url.pathname.replace("/", "").split("?")[0];
    } else if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.replace("/embed/", "").split("?")[0];
    } else if (
      url.hostname.includes("youtube-nocookie.com") &&
      url.pathname.startsWith("/embed/")
    ) {
      videoId = url.pathname.replace("/embed/", "").split("?")[0];
    }

    if (videoId) {
      const params = new URLSearchParams({
        autoplay: opts.autoPlay ? "1" : "0",
        mute: opts.muted ? "1" : "0",
        loop: opts.loop ? "1" : "0",
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
        enablejsapi: "1",
        origin: typeof window !== "undefined" ? window.location.origin : "",
        ...(opts.loop && videoId ? { playlist: videoId } : {}),
      });
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    }
  } catch {
    // not parseable — fall through
  }
  return raw;
}

/** Simple CDN node label derived from hostname for the perf HUD */
function cdnNode(src: string): string {
  try {
    const { hostname } = new URL(src);
    if (hostname.includes("commondatastorage")) return "GCS · Global CDN";
    if (hostname.includes("archive.org")) return "Archive.org · Edge";
    if (hostname.includes("w3schools")) return "W3S · EU";
    if (hostname.includes("cloudfront")) return "CloudFront · AWS";
    if (hostname.includes("akamai")) return "Akamai · Edge";
    return hostname;
  } catch {
    return "CDN";
  }
}

export function VideoPlayer({
  sources,
  embedUrl,
  poster,
  className,
  autoPlay = false,
  controls = false,
  loop = false,
  muted = false,
  playsInline = true,
  preload = "metadata",
  fill = false,
  onClick,
  onPlaybackReady,
  onPlaybackFailed,
  onMetadata,
  onAllSourcesFailed,
  onDimensions,
  initialAspectRatio = 16 / 9,
  emptyLabel = "No video source available.",
  showPerfHud = false,
}: VideoPlayerProps) {
  // ── YouTube / embed path ────────────────────────────────────────────────

  // ── Native video path ───────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(initialAspectRatio);
  const [bufferHealth, setBufferHealth] = useState(0);
  const safeSources = useMemo(() => Array.from(new Set(sources.filter(Boolean))), [sources]);
  const activeSource = safeSources[sourceIndex] ?? "";

  useEffect(() => {
    setSourceIndex(0);
    setIsLoading(true);
    setHasError(false);
    setAspectRatio(initialAspectRatio);
  }, [safeSources, initialAspectRatio]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSource) return;
    video.load();
  }, [activeSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!autoPlay) {
      video.pause();
      return;
    }
    void video.play().catch(() => {
      /* autoplay blocked */
    });
  }, [autoPlay, activeSource]);

  // Buffer health monitor — updates every 500ms while playing
  useEffect(() => {
    if (!showPerfHud) return;
    const video = videoRef.current;
    if (!video) return;
    const id = window.setInterval(() => {
      if (!video.buffered.length) return;
      const end = video.buffered.end(video.buffered.length - 1);
      const ahead = Math.max(0, end - video.currentTime);
      setBufferHealth(Math.min(100, Math.round((ahead / 30) * 100)));
    }, 500);
    return () => clearInterval(id);
  }, [showPerfHud]);

  const retry = () => {
    if (!safeSources.length) return;
    setHasError(false);
    setIsLoading(true);
    setSourceIndex(0);
  };

  const handleError = () => {
    if (sourceIndex < safeSources.length - 1) {
      setSourceIndex((c) => c + 1);
      return;
    }
    setHasError(true);
    setIsLoading(false);
    onPlaybackFailed?.();
    onAllSourcesFailed?.();
  };

  if (embedUrl) {
    const embedSrc = buildYouTubeEmbedSrc(embedUrl, { autoPlay, muted, loop });
    return (
      <div
        className="relative w-full"
        style={fill ? { position: "absolute", inset: 0 } : { aspectRatio: initialAspectRatio }}
      >
        <iframe
          src={embedSrc}
          title="Embedded video player"
          className={className ?? "h-full w-full"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => onPlaybackReady?.()}
        />
        {showPerfHud && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-mono text-emerald-400 backdrop-blur">
            <Zap className="h-2.5 w-2.5" />
            YouTube Â· Privacy-Enhanced
          </div>
        )}
      </div>
    );
  }

  if (!safeSources.length) {
    return (
      <div
        className="flex items-center justify-center bg-muted/20 px-4 text-center text-sm text-muted-foreground"
        style={fill ? { position: "absolute", inset: 0 } : { aspectRatio: initialAspectRatio }}
      >
        {emptyLabel}
      </div>
    );
  }

  const wrapperStyle: CSSProperties = fill ? { position: "absolute", inset: 0 } : { aspectRatio };

  return (
    <div className="relative w-full" style={wrapperStyle}>
      <video
        ref={videoRef}
        className={className ?? "h-full w-full object-contain"}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        preload={preload}
        poster={poster}
        onClick={onClick}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth && v.videoHeight) {
            const ratio = v.videoWidth / v.videoHeight;
            setAspectRatio(ratio);
            onMetadata?.({ width: v.videoWidth, height: v.videoHeight, aspectRatio: ratio });
            onDimensions?.({ width: v.videoWidth, height: v.videoHeight, aspectRatio: ratio });
          }
        }}
        onLoadedData={() => {
          setIsLoading(false);
          setHasError(false);
          onPlaybackReady?.();
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={handleError}
      >
        <source src={activeSource} />
      </video>

      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Buffering…
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center text-white">
          <AlertCircle className="h-8 w-8 text-red-300" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Video could not be loaded.</p>
            <p className="text-xs text-white/70">
              All {safeSources.length} source{safeSources.length !== 1 ? "s" : ""} failed.
            </p>
          </div>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Performance HUD — CDN node + buffer health */}
      {showPerfHud && !hasError && activeSource && (
        <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-mono text-emerald-400 backdrop-blur pointer-events-none">
          <Wifi className="h-2.5 w-2.5" />
          {cdnNode(activeSource)}
          <span className="text-white/50">·</span>
          <span
            className={
              bufferHealth > 60
                ? "text-emerald-400"
                : bufferHealth > 20
                  ? "text-amber-400"
                  : "text-red-400"
            }
          >
            buf {bufferHealth}%
          </span>
          {sourceIndex > 0 && (
            <>
              <span className="text-white/50">·</span>
              <span className="text-amber-300">
                src {sourceIndex + 1}/{safeSources.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
