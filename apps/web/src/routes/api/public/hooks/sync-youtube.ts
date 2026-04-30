import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---- Types ---------------------------------------------------------------
type YTSearchItem = {
  id: { kind: string; videoId?: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
};

type YTSearchResponse = { items?: YTSearchItem[]; error?: { message: string } };

type YTVideoDetail = {
  id: string;
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; privacyStatus?: string };
};

type YTVideoDetailResponse = {
  items?: YTVideoDetail[];
  error?: { message: string };
};

type SourceRow = {
  id: string;
  kind: "channel" | "query";
  value: string;
  category: string;
  max_results: number;
};

// ---- Helpers -------------------------------------------------------------
const YT_BASE = "https://www.googleapis.com/youtube/v3";

/** Headers that satisfy YouTube API referer checks */
const ytHeaders = {
  "User-Agent": "NexusPlatform/1.0 (server-sync)",
  Accept: "application/json",
  // YouTube Data API v3 does NOT enforce Referer for server-key calls,
  // but some edge proxies strip or block empty-referer requests.
  // Providing an explicit server origin resolves "Requests from referer <empty> are blocked."
  Referer: "https://cuddly-creation-space.lovable.app/",
  Origin: "https://cuddly-creation-space.lovable.app",
};

function pickThumb(t: YTSearchItem["snippet"]["thumbnails"]): string | null {
  return t.high?.url ?? t.medium?.url ?? t.default?.url ?? null;
}

/** Convert ISO 8601 duration (PT4M13S) to a human label like "4:13" */
function parseDuration(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] ?? "0");
  const min = parseInt(m[2] ?? "0");
  const sec = parseInt(m[3] ?? "0");
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

/**
 * Fetch video IDs from search, returning snippet items.
 * Uses explicit headers to avoid empty-referer rejections.
 */
async function fetchSourceVideos(src: SourceRow, apiKey: string): Promise<YTSearchItem[]> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true", // only return embeddable videos
    videoSyndicated: "true", // only return videos playable outside YouTube
    maxResults: String(Math.min(src.max_results, 50)),
    order: "date",
    key: apiKey,
  });
  if (src.kind === "channel") params.set("channelId", src.value);
  else params.set("q", src.value);

  const url = `${YT_BASE}/search?${params.toString()}`;
  const res = await fetch(url, { method: "GET", headers: ytHeaders });
  const json = (await res.json()) as YTSearchResponse;
  if (!res.ok) throw new Error(json.error?.message ?? `YouTube search API ${res.status}`);
  return (json.items ?? []).filter((i) => i.id?.videoId);
}

/**
 * Fetch full video details (embeddable status + duration) for a batch of IDs.
 * Filters out private, deleted, or non-embeddable videos before DB insert.
 */
async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, YTVideoDetail>> {
  if (videoIds.length === 0) return new Map();

  const params = new URLSearchParams({
    part: "contentDetails,status",
    id: videoIds.join(","),
    key: apiKey,
  });

  const url = `${YT_BASE}/videos?${params.toString()}`;
  const res = await fetch(url, { method: "GET", headers: ytHeaders });
  const json = (await res.json()) as YTVideoDetailResponse;
  if (!res.ok) throw new Error(json.error?.message ?? `YouTube videos API ${res.status}`);

  const map = new Map<string, YTVideoDetail>();
  for (const item of json.items ?? []) {
    map.set(item.id, item);
  }
  return map;
}

/**
 * Quick oEmbed probe: confirms a video URL actually resolves and is playable.
 * Returns true if the video is accessible, false if blocked/deleted.
 */
async function isVideoPlayable(videoId: string): Promise<boolean> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, {
      method: "GET",
      headers: { ...ytHeaders, Accept: "application/json" },
      signal: AbortSignal.timeout(5000), // 5 s timeout
    });
    // 200 = playable, 401/403/404 = blocked or deleted
    return res.status === 200;
  } catch {
    return false; // network error → treat as unplayable
  }
}

// ---- Route ---------------------------------------------------------------
export const Route = createFileRoute("/api/public/hooks/sync-youtube")({
  server: {
    handlers: {
      POST: async () => handle(),
      GET: async () => handle(), // allow manual trigger from browser
    },
  },
});

async function handle() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
  }

  const { data: sources, error: srcErr } = await supabaseAdmin
    .from("youtube_sources")
    .select("id, kind, value, category, max_results")
    .eq("is_active", true);

  if (srcErr) return Response.json({ ok: false, error: srcErr.message }, { status: 500 });
  if (!sources?.length) return Response.json({ ok: true, inserted: 0, note: "no active sources" });

  let totalInserted = 0;
  let totalSkippedUnplayable = 0;
  const perSource: Array<{ id: string; inserted: number; skipped?: number; error?: string }> = [];

  for (const src of sources as SourceRow[]) {
    try {
      // 1. Search for videos
      const items = await fetchSourceVideos(src, apiKey);
      if (items.length === 0) {
        perSource.push({ id: src.id, inserted: 0 });
        await supabaseAdmin
          .from("youtube_sources")
          .update({ last_synced_at: new Date().toISOString(), last_error: null })
          .eq("id", src.id);
        continue;
      }

      const videoIds = items.map((i) => i.id.videoId!) as string[];
      const sourceUrls = videoIds.map((id) => `https://www.youtube.com/watch?v=${id}`);

      // 2. Skip already-existing records
      const { data: existing } = await supabaseAdmin
        .from("public_videos")
        .select("source_url")
        .in("source_url", sourceUrls);

      const existingSet = new Set((existing ?? []).map((r) => r.source_url));
      const newItems = items.filter(
        (it) => !existingSet.has(`https://www.youtube.com/watch?v=${it.id.videoId}`),
      );

      if (newItems.length === 0) {
        perSource.push({ id: src.id, inserted: 0 });
        await supabaseAdmin
          .from("youtube_sources")
          .update({ last_synced_at: new Date().toISOString(), last_error: null })
          .eq("id", src.id);
        continue;
      }

      // 3. Fetch full details (embeddable check + duration)
      const newVideoIds = newItems.map((i) => i.id.videoId!);
      const detailMap = await fetchVideoDetails(newVideoIds, apiKey);

      // 4. Filter: keep only embeddable, public, non-private videos
      const embeddableItems = newItems.filter((it) => {
        const detail = detailMap.get(it.id.videoId!);
        if (!detail) return false; // not found in details → skip
        const status = detail.status;
        if (!status) return true; // no status info → optimistically keep
        if (status.privacyStatus === "private" || status.privacyStatus === "unlisted") return false;
        if (status.embeddable === false) return false;
        return true;
      });

      // 5. oEmbed playability test (catches geo-blocked, age-restricted, deleted)
      const playabilityChecks = await Promise.allSettled(
        embeddableItems.map(async (it) => ({
          item: it,
          playable: await isVideoPlayable(it.id.videoId!),
        })),
      );

      const playableItems = playabilityChecks
        .filter(
          (r): r is PromiseFulfilledResult<{ item: YTSearchItem; playable: boolean }> =>
            r.status === "fulfilled" && r.value.playable,
        )
        .map((r) => r.value.item);

      const skippedCount =
        newItems.length - embeddableItems.length + (embeddableItems.length - playableItems.length);

      totalSkippedUnplayable += skippedCount;

      // 6. Build rows and insert
      const rows = playableItems.map((it) => {
        const vid = it.id.videoId!;
        const detail = detailMap.get(vid);
        return {
          title: it.snippet.title.slice(0, 200),
          description: (it.snippet.description ?? "").slice(0, 500) || null,
          author: it.snippet.channelTitle ?? null,
          provider: "youtube",
          source_url: `https://www.youtube.com/watch?v=${vid}`,
          page_url: `https://www.youtube.com/watch?v=${vid}`,
          poster_url: pickThumb(it.snippet.thumbnails),
          duration_label: parseDuration(detail?.contentDetails?.duration),
          kind: "youtube",
          category: src.category,
          is_active: true,
        };
      });

      let insertedCount = 0;
      if (rows.length > 0) {
        const { error: insErr } = await supabaseAdmin.from("public_videos").insert(rows);
        if (insErr) throw insErr;
        insertedCount = rows.length;
        totalInserted += insertedCount;
      }

      perSource.push({ id: src.id, inserted: insertedCount, skipped: skippedCount });
      await supabaseAdmin
        .from("youtube_sources")
        .update({ last_synced_at: new Date().toISOString(), last_error: null })
        .eq("id", src.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[sync-youtube] source ${src.id} failed:`, msg);
      perSource.push({ id: src.id, inserted: 0, error: msg });
      await supabaseAdmin
        .from("youtube_sources")
        .update({ last_synced_at: new Date().toISOString(), last_error: msg.slice(0, 500) })
        .eq("id", src.id);
    }
  }

  return Response.json({
    ok: true,
    inserted: totalInserted,
    skipped_unplayable: totalSkippedUnplayable,
    sources: perSource,
  });
}
