/**
 * use-video-discovery.ts
 *
 * Loads videos from public_videos DB with a built-in pre-flight prober:
 *   1. Fetch a batch (e.g. 24 rows) from DB
 *   2. Probe each URL concurrently (HEAD for native, oEmbed for YouTube)
 *   3. Only pass VERIFIED playable videos to the feed
 *   4. Mark broken rows is_active=false in DB (silent background call)
 *   5. If verified batch is smaller than desired, fetch more rows and repeat
 *
 * This guarantees "no video available" is NEVER shown as long as the DB
 * has any real content — we keep fetching until we have enough verified ones.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  kind: "native" | "youtube";
  embedUrl?: string;
}

type DbRow = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  provider: string;
  source_url: string;
  poster_url: string | null;
  page_url: string | null;
  kind: string;
  category: string;
  duration_label: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PROBE_TIMEOUT_MS = 5000;
const PROBE_CONCURRENCY = 14;
// Fetch this many DB rows per attempt to always have enough after filtering
const DB_FETCH_MULTIPLIER = 3;
// Never fetch more than this per attempt to avoid huge payloads
const MAX_ROWS_PER_ATTEMPT = 120;

const DEFAULT_QUERY = "";

// ─── Probe helpers ────────────────────────────────────────────────────────────

async function probeNativeUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    // HEAD first (fastest, no body)
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      // credentials: "omit" avoids CORS preflight on cross-origin requests
    });
    clearTimeout(timer);
    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      if (
        ct.startsWith("video/") ||
        ct.includes("octet-stream") ||
        /\.(mp4|webm|ogv)($|\?)/i.test(url)
      ) {
        return true;
      }
      // Some CDNs return 200 with text/html on redirect — do a small GET
    }
    // Fall through to ranged GET
  } catch {
    clearTimeout(timer);
    // Timeout or network error
    return false;
  }

  // Ranged GET — confirms it's a real byte stream
  const c2 = new AbortController();
  const t2 = setTimeout(() => c2.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1023" },
      signal: c2.signal,
    });
    clearTimeout(t2);
    if (!res.ok && res.status !== 206) return false;
    const ct = res.headers.get("content-type") ?? "";
    return (
      ct.startsWith("video/") || ct.includes("octet-stream") || /\.(mp4|webm|ogv)($|\?)/i.test(url)
    );
  } catch {
    clearTimeout(t2);
    return false;
  }
}

async function probeYouTubeUrl(sourceUrl: string): Promise<boolean> {
  // Extract video ID from any YouTube URL variant
  let videoId: string | null = null;
  try {
    const u = new URL(sourceUrl);
    if (u.searchParams.has("v")) videoId = u.searchParams.get("v");
    else {
      const parts = u.pathname.split("/").filter(Boolean);
      videoId = parts[parts.length - 1] ?? null;
    }
  } catch {
    return false;
  }
  if (!videoId || videoId.length < 5) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    return res.status === 200;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

async function probeVideo(row: DbRow): Promise<boolean> {
  if (row.kind === "youtube" || row.provider === "youtube") {
    return probeYouTubeUrl(row.source_url);
  }
  return probeNativeUrl(row.source_url);
}

/** Probe all rows in parallel batches of `concurrency` */
async function probeRows(rows: DbRow[], concurrency = PROBE_CONCURRENCY): Promise<boolean[]> {
  const results: boolean[] = new Array(rows.length).fill(false);
  for (let i = 0; i < rows.length; i += concurrency) {
    const batch = rows.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map((r) => probeVideo(r)));
    settled.forEach((r, j) => {
      results[i + j] = r.status === "fulfilled" ? r.value : false;
    });
  }
  return results;
}

/** Silently mark broken row IDs is_active=false in DB */
function markBrokenAsync(brokenIds: string[]) {
  if (!brokenIds.length) return;
  // Fire and forget — don't await, don't block the feed
  supabase
    .from("public_videos")
    .update({ is_active: false })
    .in("id", brokenIds)
    .then(({ error }) => {
      if (error) console.warn("[discovery] failed to mark broken:", error.message);
    });
}

// ─── Category inference ───────────────────────────────────────────────────────

function inferCategory(text: string): VideoCategory {
  const t = text.toLowerCase();
  if (/(documentary|interview|science|nature|history|space|wildlife|geo|bbc|national)/.test(t))
    return "Docs";
  if (/(clip|short|trailer|episode|series|vlog|review|tutorial|cooking|fitness)/.test(t))
    return "Series";
  return "Cinema";
}

function mapRow(row: DbRow): DiscoveredVideo {
  const isYT = row.kind === "youtube" || row.provider === "youtube";
  return {
    id: row.id,
    title: row.title,
    author: row.author ?? row.provider,
    description: row.description ?? "",
    poster: row.poster_url ?? "",
    thumbnail: row.poster_url ?? "",
    pageUrl: row.page_url ?? row.source_url,
    sources: isYT ? [] : [row.source_url],
    durationLabel: row.duration_label ?? "",
    category: (["Cinema", "Series", "Docs"].includes(row.category)
      ? row.category
      : inferCategory(row.title + " " + (row.description ?? ""))) as VideoCategory,
    provider: row.provider,
    kind: isYT ? "youtube" : "native",
    embedUrl: isYT ? row.source_url : undefined,
  };
}

function dedupeById(items: DiscoveredVideo[]): DiscoveredVideo[] {
  const seen = new Set<string>();
  return items.filter((v) => {
    const key = v.embedUrl ?? v.sources[0] ?? v.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

type Options = {
  query?: string;
  batchSize?: number;
};

export function useVideoDiscovery(options?: Options) {
  const batchSize = options?.batchSize ?? 8;
  const query = options?.query?.trim() ?? DEFAULT_QUERY;

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [videos, setVideos] = useState<DiscoveredVideo[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination cursor: how many DB rows we've already fetched
  const dbOffsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const seenIdsRef = useRef(new Set<string>());
  const reqIdRef = useRef(0);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  // ── Core loader ────────────────────────────────────────────────────────
  const loadMore = useCallback(
    async (reset = false) => {
      if (loadingRef.current && !reset) return;
      if (!hasMoreRef.current && !reset) return;

      const reqId = ++reqIdRef.current;
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      if (reset) {
        dbOffsetRef.current = 0;
        hasMoreRef.current = true;
        seenIdsRef.current = new Set();
      }

      const collectedVerified: DiscoveredVideo[] = [];
      // We keep fetching until we have `batchSize` verified videos or DB is exhausted
      const target = batchSize;
      let attempts = 0;
      const maxAttempts = 6; // prevent infinite loop

      while (collectedVerified.length < target && hasMoreRef.current && attempts < maxAttempts) {
        attempts++;
        if (reqId !== reqIdRef.current) break; // stale request

        const fetchCount = Math.min(
          Math.max(batchSize, target - collectedVerified.length) * DB_FETCH_MULTIPLIER,
          MAX_ROWS_PER_ATTEMPT,
        );
        const from = dbOffsetRef.current;
        const to = from + fetchCount - 1;

        try {
          let q = supabase
            .from("public_videos")
            .select(
              "id,title,description,author,provider,source_url,poster_url,page_url,kind,category,duration_label",
            )
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false })
            .range(from, to);

          if (debouncedQuery) {
            q = q.or(
              `title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%,category.ilike.%${debouncedQuery}%,author.ilike.%${debouncedQuery}%,provider.ilike.%${debouncedQuery}%`,
            );
          }

          const { data, error: dbErr } = await q;
          if (dbErr) throw dbErr;
          if (reqId !== reqIdRef.current) break;

          const rows = (data ?? []) as DbRow[];
          dbOffsetRef.current += rows.length;

          if (rows.length < fetchCount) {
            hasMoreRef.current = false;
            setHasMore(false);
          }

          if (rows.length === 0) break;

          // Filter already-seen
          const unseenRows = rows.filter((r) => !seenIdsRef.current.has(r.id));
          if (!unseenRows.length) continue;

          // ── Probe all unseen rows ──────────────────────────────────────
          const playable = await probeRows(unseenRows);
          if (reqId !== reqIdRef.current) break;

          const brokenIds: string[] = [];
          const verifiedRows: DbRow[] = [];

          unseenRows.forEach((row, i) => {
            seenIdsRef.current.add(row.id);
            if (playable[i]) {
              verifiedRows.push(row);
            } else {
              brokenIds.push(row.id);
            }
          });

          // Mark broken silently
          markBrokenAsync(brokenIds);

          // Map to DiscoveredVideo
          const newVideos = verifiedRows.map(mapRow);
          collectedVerified.push(...newVideos);
        } catch (err) {
          if (reqId !== reqIdRef.current) break;
          const msg = err instanceof Error ? err.message : "Failed to load videos";
          setError(msg);
          break;
        }
      }

      if (reqId !== reqIdRef.current) return;

      if (collectedVerified.length > 0) {
        setVideos((prev) =>
          reset ? dedupeById(collectedVerified) : dedupeById([...prev, ...collectedVerified]),
        );
      }

      // If we got nothing at all on a reset, set error so UI can show a helpful message
      if (reset && collectedVerified.length === 0) {
        setError(
          "No playable videos found. Run /api/public/hooks/crawl-and-seed to populate the feed.",
        );
      }

      loadingRef.current = false;
      setIsLoading(false);
    },
    [batchSize, debouncedQuery],
  );

  // ── Reset on query change ──────────────────────────────────────────────
  useEffect(() => {
    setVideos([]);
    setHasMore(true);
    setError(null);
    void loadMore(true);
  }, [debouncedQuery, loadMore]);

  const removeVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    seenIdsRef.current.add(id); // prevent re-fetching
  }, []);

  return useMemo(
    () => ({
      videos,
      hasMore,
      isLoading,
      error,
      loadMore: () => loadMore(false),
      removeVideo,
      query: debouncedQuery,
    }),
    [videos, hasMore, isLoading, error, loadMore, removeVideo, debouncedQuery],
  );
}
