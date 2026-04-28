import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_DISCOVERY_QUERY,
  fetchDiscoveredVideos,
  type DiscoveredVideo,
} from "@/lib/demo-videos";

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
  const [videos, setVideos] = useState<DiscoveredVideo[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const cursorRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

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
        const response = await fetchDiscoveredVideos({
          data: {
            query: debouncedQuery,
            cursor: reset ? 0 : cursorRef.current,
            limit: batchSize,
          },
        });

        if (requestId !== requestIdRef.current) return;

        setVideos((prev) => dedupeVideos(reset ? response.videos : [...prev, ...response.videos]));
        setCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Could not discover videos.");
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [batchSize, debouncedQuery],
  );

  useEffect(() => {
    setVideos([]);
    setCursor(0);
    setHasMore(true);
    setError(null);
    cursorRef.current = 0;
    hasMoreRef.current = true;
    requestIdRef.current += 1;
    void loadMore(true);
  }, [debouncedQuery, loadMore]);

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
