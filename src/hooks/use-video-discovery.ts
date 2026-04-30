import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VideoCategory = "Cinema" | "Series" | "Docs";

export interface DiscoveredVideo {
  id: string;
  title: string;
  author: string;
  description: string;
  poster: string;
  thumbnail: string;
  pageUrl: string;
  sources: string[];
  durationLabel: string;
  category: VideoCategory;
  provider: string;
  kind?: "native" | "youtube";
  embedUrl?: string;
}

type ApiVideoHit = {
  id: string;
  title: string;
  description?: string;
  poster?: string;
  source: string;
  pageUrl?: string;
  provider: string;
  kind: "native" | "youtube";
  durationLabel?: string;
};

const DEFAULT_DISCOVERY_QUERY = "movies trailers documentaries music videos short films";

const FAST_SEED_VIDEOS: DiscoveredVideo[] = [
  {
    id: "seed-bbb",
    title: "Big Buck Bunny",
    author: "Blender Foundation",
    description: "Open movie sample that loads instantly.",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    pageUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    sources: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"],
    durationLabel: "9m 56s",
    category: "Cinema",
    provider: "Google sample video",
    kind: "native",
  },
  {
    id: "seed-tears",
    title: "Tears of Steel",
    author: "Blender Foundation",
    description: "High-quality open film sample for fast playback.",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
    thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
    pageUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    sources: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"],
    durationLabel: "12m 14s",
    category: "Cinema",
    provider: "Google sample video",
  },
  {
    id: "seed-sintel",
    title: "Sintel",
    author: "Blender Foundation",
    description: "Reliable sample content with immediate first paint.",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
    thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
    pageUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    sources: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"],
    durationLabel: "14m 48s",
    category: "Cinema",
    provider: "Google sample video",
  },
  {
    id: "seed-bunny-short",
    title: "Bunny Trailer",
    author: "W3Schools",
    description: "Short verified MP4 clip for lightweight playback.",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    pageUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    sources: ["https://www.w3schools.com/html/mov_bbb.mp4"],
    durationLabel: "10s",
    category: "Series",
    provider: "W3Schools",
  },
];

function inferCategory(text: string): VideoCategory {
  const normalized = text.toLowerCase();
  if (/(documentary|interview|science|nature|history|space)/.test(normalized)) return "Docs";
  if (/(clip|short|trailer|episode|series)/.test(normalized)) return "Series";
  return "Cinema";
}

function mapApiHit(hit: ApiVideoHit): DiscoveredVideo {
  const category = inferCategory(`${hit.title} ${hit.description ?? ""}`);
  return {
    id: hit.id,
    title: hit.title,
    author: hit.provider,
    description: hit.description ?? "Fast verified video source.",
    poster: hit.poster ?? "",
    thumbnail: hit.poster ?? "",
    pageUrl: hit.pageUrl ?? hit.source,
    sources: [hit.source],
    durationLabel: hit.durationLabel ?? "Live",
    category,
    provider: hit.provider,
  };
}

function filterSeedVideos(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return FAST_SEED_VIDEOS;
  const matches = FAST_SEED_VIDEOS.filter((video) =>
    `${video.title} ${video.description} ${video.category} ${video.provider}`.toLowerCase().includes(needle),
  );
  return matches.length ? matches : FAST_SEED_VIDEOS;
}

type UseVideoDiscoveryOptions = {
  query?: string;
  batchSize?: number;
  autoPrefetch?: boolean;
};

function dedupeVideos(items: DiscoveredVideo[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.sources[0] ?? item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useVideoDiscovery(options?: UseVideoDiscoveryOptions) {
  const query = (options?.query?.trim() || DEFAULT_DISCOVERY_QUERY).slice(0, 120);
  const batchSize = options?.batchSize ?? 6;
  const autoPrefetch = options?.autoPrefetch ?? true;
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [videos, setVideos] = useState<DiscoveredVideo[]>(() => filterSeedVideos(query).slice(0, batchSize));
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingRef.current = isLoading;
  }, [isLoading]);

  const loadMore = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      if (!reset && !hasMoreRef.current) return;

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const nextPage = reset ? 1 : pageRef.current + 1;
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: String(Math.max(batchSize * 2, 8)),
          page: String(nextPage),
        });
        const response = await fetch(`/api/videos/search?${params}`);
        if (!response.ok) {
          throw new Error(`Video feed unavailable (${response.status})`);
        }
        const payload = (await response.json()) as { results?: ApiVideoHit[]; hasMore?: boolean };
        const remoteVideos = (payload.results ?? [])
          .filter((item) => item.kind === "native")
          .map(mapApiHit)
          .slice(0, batchSize);
        const seed = filterSeedVideos(debouncedQuery).slice(0, batchSize);

        if (requestId !== requestIdRef.current) return;

        setVideos((prev) => dedupeVideos(reset ? [...seed, ...remoteVideos] : [...prev, ...remoteVideos]));
        setPage(nextPage);
        setHasMore(Boolean(payload.hasMore) && remoteVideos.length > 0);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setVideos((prev) => (reset ? filterSeedVideos(debouncedQuery).slice(0, batchSize) : prev));
        setHasMore(false);
        setError(err instanceof Error ? err.message : "Could not discover videos.");
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [batchSize, debouncedQuery],
  );

  useEffect(() => {
    setVideos(filterSeedVideos(debouncedQuery).slice(0, batchSize));
    setPage(0);
    setHasMore(true);
    setError(null);
    pageRef.current = 0;
    hasMoreRef.current = true;
    requestIdRef.current += 1;
    void loadMore(true);
  }, [batchSize, debouncedQuery, loadMore]);

  const removeVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((video) => video.id !== id));
  }, []);

  const state = useMemo(
    () => ({
      videos,
      hasMore,
      isLoading,
      error,
      loadMore,
      removeVideo,
      query: debouncedQuery,
      autoPrefetch,
    }),
    [autoPrefetch, debouncedQuery, error, hasMore, isLoading, loadMore, removeVideo, videos],
  );

  return state;
}
