import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AlertCircle, LoaderCircle, RefreshCcw } from "lucide-react";

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
  onClick?: () => void;
  onPlaybackReady?: () => void;
  onPlaybackFailed?: () => void;
  onMetadata?: (payload: { width: number; height: number; aspectRatio: number }) => void;
  onAllSourcesFailed?: () => void;
  onDimensions?: (dims: { width: number; height: number; aspectRatio: number }) => void;
  /** Initial known aspect ratio (W/H) so the box reserves space before the
   *  video metadata loads — avoids layout jumps. Defaults to 16/9. */
  initialAspectRatio?: number;
  emptyLabel?: string;
};

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
  onClick,
  onPlaybackReady,
  onPlaybackFailed,
  onMetadata,
  onAllSourcesFailed,
  onDimensions,
  initialAspectRatio = 16 / 9,
  emptyLabel = "No video source available.",
}: VideoPlayerProps) {
  if (embedUrl) {
    // Normalise any YouTube URL variant into an embed URL with autoplay/mute params
    const buildEmbedSrc = (raw: string): string => {
      try {
        const url = new URL(raw);
        let videoId: string | null = null;

        // https://www.youtube.com/watch?v=VIDEO_ID
        if (url.hostname.includes("youtube.com") && url.pathname === "/watch") {
          videoId = url.searchParams.get("v");
        }
        // https://youtu.be/VIDEO_ID
        if (url.hostname === "youtu.be") {
          videoId = url.pathname.replace("/", "");
        }
        // Already an embed URL – just append params
        if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/embed/")) {
          videoId = url.pathname.replace("/embed/", "");
        }

        if (videoId) {
          const params = new URLSearchParams({
            autoplay: autoPlay ? "1" : "0",
            mute: muted ? "1" : "0",
            loop: loop ? "1" : "0",
            rel: "0",
            modestbranding: "1",
            ...(loop && videoId ? { playlist: videoId } : {}),
          });
          return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
        }
      } catch {
        // not a parseable URL – fall through
      }
      return raw;
    };

    return (
      <div className="relative w-full" style={{ aspectRatio: initialAspectRatio }}>
        <iframe
          src={buildEmbedSrc(embedUrl)}
          title="Embedded video player"
          className={className ?? "h-full w-full"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => onPlaybackReady?.()}
        />
      </div>
    );
  }

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(initialAspectRatio);
  const safeSources = useMemo(
    () => Array.from(new Set(sources.filter(Boolean))),
    [sources],
  );
  const activeSource = safeSources[sourceIndex] ?? "";

  useEffect(() => {
    setSourceIndex(0);
    setIsLoading(true);
    setHasError(false);
    setAspectRatio(initialAspectRatio);
  }, [safeSources]);

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

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        /* autoplay may be blocked until user interaction */
      }
    };

    void tryPlay();
  }, [autoPlay, activeSource]);

  const retry = () => {
    if (!safeSources.length) return;
    setHasError(false);
    setIsLoading(true);
    setSourceIndex(0);
  };

  const handleError = () => {
    if (sourceIndex < safeSources.length - 1) {
      setSourceIndex((current) => current + 1);
      return;
    }

    setHasError(true);
    setIsLoading(false);
    onPlaybackFailed?.();
    onAllSourcesFailed?.();
  };

  if (!safeSources.length) {
    return (
      <div
        className="flex items-center justify-center bg-muted/20 px-4 text-center text-sm text-muted-foreground"
        style={{ aspectRatio: initialAspectRatio }}
      >
        {emptyLabel}
      </div>
    );
  }

  // Reserve the box at the current best-known aspect ratio so the layout does
  // not jump when intrinsic dimensions arrive via `loadedmetadata`.
  const wrapperStyle: CSSProperties = { aspectRatio };

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
        onLoadedMetadata={(event) => {
          const target = event.currentTarget;
          const width = target.videoWidth;
          const height = target.videoHeight;
          if (width > 0 && height > 0) {
            onMetadata?.({ width, height, aspectRatio: width / height });
          }
          const v = event.currentTarget;
          if (v.videoWidth && v.videoHeight) {
            const ratio = v.videoWidth / v.videoHeight;
            setAspectRatio(ratio);
            onDimensions?.({
              width: v.videoWidth,
              height: v.videoHeight,
              aspectRatio: ratio,
            });
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

      {isLoading && !hasError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading video
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center text-white">
          <AlertCircle className="h-8 w-8 text-red-300" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">This video could not be loaded.</p>
            <p className="text-xs text-white/70">We tried every available source for this item.</p>
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
    </div>
  );
}
