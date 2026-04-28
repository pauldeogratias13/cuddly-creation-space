import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AlertCircle, LoaderCircle, RefreshCcw } from "lucide-react";

type VideoPlayerProps = {
  sources: string[];
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
<<<<<<< HEAD
  onPlaybackFailed?: () => void;
  onMetadata?: (payload: { width: number; height: number; aspectRatio: number }) => void;
=======
  onAllSourcesFailed?: () => void;
  onDimensions?: (dims: { width: number; height: number; aspectRatio: number }) => void;
  /** Initial known aspect ratio (W/H) so the box reserves space before the
   *  video metadata loads — avoids layout jumps. Defaults to 16/9. */
  initialAspectRatio?: number;
>>>>>>> 16a613186dedb36b1cc9b3b0f934f04ae65530b7
  emptyLabel?: string;
};

export function VideoPlayer({
  sources,
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
<<<<<<< HEAD
  onPlaybackFailed,
  onMetadata,
=======
  onAllSourcesFailed,
  onDimensions,
  initialAspectRatio = 16 / 9,
>>>>>>> 16a613186dedb36b1cc9b3b0f934f04ae65530b7
  emptyLabel = "No video source available.",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
<<<<<<< HEAD
  const safeSources = useMemo(() => Array.from(new Set(sources.filter(Boolean))), [sources]);
=======
  const [aspectRatio, setAspectRatio] = useState<number>(initialAspectRatio);
  const safeSources = useMemo(
    () => Array.from(new Set(sources.filter(Boolean))),
    [sources],
  );
>>>>>>> 16a613186dedb36b1cc9b3b0f934f04ae65530b7
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
<<<<<<< HEAD
    onPlaybackFailed?.();
=======
    onAllSourcesFailed?.();
>>>>>>> 16a613186dedb36b1cc9b3b0f934f04ae65530b7
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
<<<<<<< HEAD
          const target = event.currentTarget;
          const width = target.videoWidth;
          const height = target.videoHeight;
          if (width > 0 && height > 0) {
            onMetadata?.({ width, height, aspectRatio: width / height });
=======
          const v = event.currentTarget;
          if (v.videoWidth && v.videoHeight) {
            const ratio = v.videoWidth / v.videoHeight;
            setAspectRatio(ratio);
            onDimensions?.({
              width: v.videoWidth,
              height: v.videoHeight,
              aspectRatio: ratio,
            });
>>>>>>> 16a613186dedb36b1cc9b3b0f934f04ae65530b7
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
