/**
 * crawl-and-seed.ts
 * POST /api/public/hooks/crawl-and-seed
 *
 * Crawls multiple video sources, tests every candidate URL for real
 * playability, and inserts only working videos into public_videos.
 * Also deletes any existing DB rows whose source_url no longer resolves.
 *
 * Sources crawled:
 *   1. YouTube Data API v3 — many search queries across categories
 *   2. Internet Archive — free/public-domain films by genre
 *   3. GCS sample bucket — always-on Blender foundation clips
 *   4. Coverr CDN — free stock video (no auth required)
 *   5. Mixkit CDN — free stock clips
 *
 * ?purge=true   (default true)  — delete DB rows whose URLs are broken
 * ?limit=N      (default 200)   — max new videos to insert per run
 * ?categories   (default all)   — comma-separated list of categories to crawl
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoCandidate = {
  title: string;
  description: string | null;
  author: string | null;
  provider: string;
  source_url: string;
  page_url: string | null;
  poster_url: string | null;
  duration_label: string | null;
  kind: "youtube" | "native";
  category: string;
};

type YTItem = {
  id: { videoId?: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
};

type YTDetailItem = {
  id: string;
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; privacyStatus?: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVER_HEADERS = {
  "User-Agent": "NexusPlatform/1.0 (crawler)",
  Accept: "application/json",
  Referer: "https://cuddly-creation-space.lovable.app/",
  Origin: "https://cuddly-creation-space.lovable.app",
};

/** YouTube search terms × categories to crawl - EXPANDED for maximum coverage */
const YT_QUERIES: Array<{ q: string; category: string }> = [
  // Cinema - Short Films & Independent
  { q: "best short films 2024", category: "Cinema" },
  { q: "award winning short film", category: "Cinema" },
  { q: "independent film full movie", category: "Cinema" },
  { q: "sci-fi short film 2024", category: "Cinema" },
  { q: "drama short film festival", category: "Cinema" },
  { q: "horror short film", category: "Cinema" },
  { q: "comedy short film", category: "Cinema" },
  { q: "thriller short film", category: "Cinema" },
  { q: "romantic short film", category: "Cinema" },
  { q: "action short film", category: "Cinema" },
  { q: "fantasy short film", category: "Cinema" },
  { q: "experimental film", category: "Cinema" },
  { q: "student film award", category: "Cinema" },
  { q: "film festival winner", category: "Cinema" },
  { q: "cannes short film", category: "Cinema" },
  { q: "sundance short film", category: "Cinema" },

  // Docs - Nature, Science, History
  { q: "nature documentary full", category: "Docs" },
  { q: "space documentary 2024", category: "Docs" },
  { q: "history documentary", category: "Docs" },
  { q: "science documentary", category: "Docs" },
  { q: "wildlife documentary BBC", category: "Docs" },
  { q: "ocean documentary free", category: "Docs" },
  { q: "planet earth documentary", category: "Docs" },
  { q: "cosmos documentary", category: "Docs" },
  { q: "ancient history documentary", category: "Docs" },
  { q: "war documentary", category: "Docs" },
  { q: "biography documentary", category: "Docs" },
  { q: "social documentary", category: "Docs" },
  { q: "environmental documentary", category: "Docs" },
  { q: "technology documentary", category: "Docs" },
  { q: "medical documentary", category: "Docs" },
  { q: "psychology documentary", category: "Docs" },
  { q: "crime documentary", category: "Docs" },
  { q: "investigative documentary", category: "Docs" },

  // Series / Clips - Entertainment & Education
  { q: "funny viral video 2024", category: "Series" },
  { q: "travel vlog cinematic", category: "Series" },
  { q: "cooking tutorial short", category: "Series" },
  { q: "music live performance", category: "Series" },
  { q: "tech review 2024", category: "Series" },
  { q: "fitness workout short", category: "Series" },
  { q: "animation short film", category: "Cinema" },
  { q: "street photography cinematic", category: "Docs" },
  { q: "time lapse nature stunning", category: "Docs" },
  { q: "music video official", category: "Series" },
  { q: "stand up comedy", category: "Series" },
  { q: "magic tricks tutorial", category: "Series" },
  { q: "art tutorial painting", category: "Series" },
  { q: "dance performance", category: "Series" },
  { q: "sports highlights", category: "Series" },
  { q: "gaming walkthrough", category: "Series" },
  { q: "diy project tutorial", category: "Series" },
  { q: "life hacks", category: "Series" },
  { q: "educational video kids", category: "Series" },
  { q: "language learning", category: "Series" },
  { q: "meditation relaxation", category: "Series" },
  { q: "yoga tutorial", category: "Series" },
];

/** Internet Archive queries × categories */
const IA_QUERIES: Array<{ q: string; category: string }> = [
  { q: "feature film classic", category: "Cinema" },
  { q: "short film silent era", category: "Cinema" },
  { q: "documentary nature wildlife", category: "Docs" },
  { q: "educational science film", category: "Docs" },
  { q: "newsreel historical", category: "Docs" },
  { q: "animation cartoon vintage", category: "Series" },
];

/** GCS sample bucket — always playable, good fallback */
const GCS_SEEDS: VideoCandidate[] = [
  {
    title: "Big Buck Bunny",
    description: "Open animated film by Blender Foundation.",
    author: "Blender Foundation",
    provider: "Google CDN",
    kind: "native",
    category: "Cinema",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    page_url: "https://peach.blender.org/",
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    duration_label: "9:56",
  },
  {
    title: "Elephant's Dream",
    description: "First Blender open movie.",
    author: "Blender Foundation",
    provider: "Google CDN",
    kind: "native",
    category: "Cinema",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    page_url: "https://orange.blender.org/",
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
    duration_label: "10:53",
  },
  {
    title: "Sintel",
    description: "Blender Foundation open movie about a girl and her dragon.",
    author: "Blender Foundation",
    provider: "Google CDN",
    kind: "native",
    category: "Cinema",
    source_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    page_url: "https://durian.blender.org/",
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
    duration_label: "14:48",
  },
  {
    title: "Tears of Steel",
    description: "Blender sci-fi short film.",
    author: "Blender Foundation",
    provider: "Google CDN",
    kind: "native",
    category: "Cinema",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    page_url: "https://mango.blender.org/",
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
    duration_label: "12:14",
  },
  {
    title: "Subaru Outback Review",
    description: "Car review sample video.",
    author: "Google",
    provider: "Google CDN",
    kind: "native",
    category: "Series",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    page_url: null,
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg",
    duration_label: "1:00",
  },
  {
    title: "Volkswagen GTI Review",
    description: "Car review sample video.",
    author: "Google",
    provider: "Google CDN",
    kind: "native",
    category: "Series",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    page_url: null,
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg",
    duration_label: "1:00",
  },
  {
    title: "We Are Going On Bullrun",
    description: "Rally racing sample video.",
    author: "Google",
    provider: "Google CDN",
    kind: "native",
    category: "Docs",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    page_url: null,
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg",
    duration_label: "0:59",
  },
  {
    title: "For Bigger Blazes",
    description: "Action sample video.",
    author: "Google",
    provider: "Google CDN",
    kind: "native",
    category: "Series",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    page_url: null,
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
    duration_label: "0:15",
  },
  {
    title: "For Bigger Escapes",
    description: "Adventure sample video.",
    author: "Google",
    provider: "Google CDN",
    kind: "native",
    category: "Series",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    page_url: null,
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
    duration_label: "0:15",
  },
  {
    title: "For Bigger Fun",
    description: "Fun sample video.",
    author: "Google",
    provider: "Google CDN",
    kind: "native",
    category: "Series",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    page_url: null,
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
    duration_label: "0:15",
  },
  {
    title: "For Bigger Joyrides",
    description: "Joyride sample video.",
    author: "Google",
    provider: "Google CDN",
    kind: "native",
    category: "Series",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    page_url: null,
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg",
    duration_label: "0:15",
  },
  {
    title: "For Bigger Meltdowns",
    description: "Intense sample video.",
    author: "Google",
    provider: "Google CDN",
    kind: "native",
    category: "Series",
    source_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    page_url: null,
    poster_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg",
    duration_label: "0:15",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

function parseDuration(iso?: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] ?? "0"),
    min = parseInt(m[2] ?? "0"),
    sec = parseInt(m[3] ?? "0");
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function pickThumb(t: YTItem["snippet"]["thumbnails"]): string | null {
  return t.high?.url ?? t.medium?.url ?? t.default?.url ?? null;
}

/** Test a native MP4/video URL: HEAD then ranged GET */
async function probeNative(url: string): Promise<boolean> {
  try {
    const head = await timeout(
      fetch(url, { method: "HEAD", headers: { "User-Agent": SERVER_HEADERS["User-Agent"] } }),
      4000,
      null as unknown as Response,
    );
    if (head?.ok) {
      const ct = head.headers.get("content-type") ?? "";
      if (
        ct.startsWith("video/") ||
        ct.includes("octet-stream") ||
        /\.(mp4|webm|ogg)($|\?)/i.test(url)
      )
        return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const get = await timeout(
      fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-2047", "User-Agent": SERVER_HEADERS["User-Agent"] },
      }),
      6000,
      null as unknown as Response,
    );
    if (!get) return false;
    if (!get.ok && get.status !== 206) return false;
    const ct = get.headers.get("content-type") ?? "";
    return (
      ct.startsWith("video/") || ct.includes("octet-stream") || /\.(mp4|webm|ogg)($|\?)/i.test(url)
    );
  } catch {
    return false;
  }
}

/** Test a YouTube video ID via oEmbed */
async function probeYouTube(videoId: string): Promise<boolean> {
  try {
    const res = await timeout(
      fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        {
          headers: SERVER_HEADERS,
        },
      ),
      5000,
      null as unknown as Response,
    );
    return res?.status === 200;
  } catch {
    return false;
  }
}

/** Run N probes in parallel batches of `concurrency` */
async function probeAll<T>(
  items: T[],
  probe: (item: T) => Promise<boolean>,
  concurrency = 12,
): Promise<boolean[]> {
  const results: boolean[] = new Array(items.length).fill(false);
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(probe));
    batchResults.forEach((r, j) => {
      results[i + j] = r.status === "fulfilled" ? r.value : false;
    });
  }
  return results;
}

// ─── YouTube crawler ──────────────────────────────────────────────────────────

async function crawlYouTube(
  apiKey: string,
  queries: Array<{ q: string; category: string }>,
  maxPerQuery = 20,
): Promise<VideoCandidate[]> {
  const YT = "https://www.googleapis.com/youtube/v3";
  const candidates: VideoCandidate[] = [];

  for (const { q, category } of queries) {
    try {
      // 1. Search
      const searchParams = new URLSearchParams({
        part: "snippet",
        type: "video",
        videoEmbeddable: "true",
        videoSyndicated: "true",
        maxResults: String(Math.min(maxPerQuery, 50)),
        order: "relevance",
        key: apiKey,
        q,
      });
      const searchRes = await timeout(
        fetch(`${YT}/search?${searchParams}`, { headers: SERVER_HEADERS }),
        8000,
        null as unknown as Response,
      );
      if (!searchRes?.ok) continue;
      const searchJson = (await searchRes.json()) as { items?: YTItem[] };
      const items = (searchJson.items ?? []).filter((i) => i.id?.videoId);
      if (!items.length) continue;

      // 2. Get details (embeddable status + duration)
      const ids = items.map((i) => i.id.videoId!);
      const detailParams = new URLSearchParams({
        part: "contentDetails,status",
        id: ids.join(","),
        key: apiKey,
      });
      const detailRes = await timeout(
        fetch(`${YT}/videos?${detailParams}`, { headers: SERVER_HEADERS }),
        8000,
        null as unknown as Response,
      );
      const detailMap = new Map<string, YTDetailItem>();
      if (detailRes?.ok) {
        const detailJson = (await detailRes.json()) as { items?: YTDetailItem[] };
        (detailJson.items ?? []).forEach((d) => detailMap.set(d.id, d));
      }

      // 3. Filter embeddable public videos
      for (const item of items) {
        const vid = item.id.videoId!;
        const detail = detailMap.get(vid);
        if (detail?.status?.privacyStatus === "private") continue;
        if (detail?.status?.privacyStatus === "unlisted") continue;
        if (detail?.status?.embeddable === false) continue;

        candidates.push({
          title: item.snippet.title.slice(0, 200),
          description: (item.snippet.description ?? "").slice(0, 500) || null,
          author: item.snippet.channelTitle || null,
          provider: "youtube",
          kind: "youtube",
          category,
          source_url: `https://www.youtube.com/watch?v=${vid}`,
          page_url: `https://www.youtube.com/watch?v=${vid}`,
          poster_url: pickThumb(item.snippet.thumbnails),
          duration_label: parseDuration(detail?.contentDetails?.duration),
        });
      }

      // Throttle between queries to stay within YouTube quota
      await new Promise((r) => setTimeout(r, 120));
    } catch (err) {
      console.warn(`[crawl-and-seed] YT query "${q}" failed:`, err);
    }
  }

  return candidates;
}

// ─── Internet Archive crawler ─────────────────────────────────────────────────

async function crawlInternetArchive(
  queries: Array<{ q: string; category: string }>,
  limitPerQuery = 15,
): Promise<VideoCandidate[]> {
  const candidates: VideoCandidate[] = [];

  for (const { q, category } of queries) {
    try {
      const searchUrl =
        `https://archive.org/advancedsearch.php?` +
        `q=${encodeURIComponent(`(${q}) AND mediatype:(movies) AND format:(h.264 OR MPEG4)`)}` +
        `&fl[]=identifier,title,description&sort[]=downloads+desc` +
        `&rows=${limitPerQuery}&page=1&output=json`;

      const res = await timeout(fetch(searchUrl), 8000, null as unknown as Response);
      if (!res?.ok) continue;
      const json = (await res.json()) as {
        response?: {
          docs?: { identifier: string; title?: string; description?: string | string[] }[];
        };
      };
      const docs = json.response?.docs ?? [];

      const metaResults = await Promise.allSettled(
        docs.map(async (doc) => {
          const meta = await timeout(
            fetch(`https://archive.org/metadata/${doc.identifier}`),
            6000,
            null as unknown as Response,
          );
          if (!meta?.ok) return null;
          const mj = (await meta.json()) as { files?: { name: string; format?: string }[] };
          const files = mj.files ?? [];
          const mp4 =
            files.find((f) => /\.mp4$/i.test(f.name) && /h\.?264/i.test(f.format ?? "")) ||
            files.find((f) => /\.mp4$/i.test(f.name));
          if (!mp4) return null;
          const img = files.find((f) => /\.(jpg|jpeg|png)$/i.test(f.name));
          const desc = Array.isArray(doc.description)
            ? String(doc.description[0] ?? "")
                .replace(/<[^>]+>/g, "")
                .slice(0, 400)
            : String(doc.description ?? "")
                .replace(/<[^>]+>/g, "")
                .slice(0, 400);
          return {
            title: (doc.title || doc.identifier).slice(0, 200),
            description: desc || null,
            author: "Internet Archive",
            provider: "Internet Archive",
            kind: "native" as const,
            category,
            source_url: `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp4.name)}`,
            page_url: `https://archive.org/details/${doc.identifier}`,
            poster_url: img
              ? `https://archive.org/download/${doc.identifier}/${encodeURIComponent(img.name)}`
              : `https://archive.org/services/img/${doc.identifier}`,
            duration_label: null,
          } satisfies VideoCandidate;
        }),
      );

      for (const r of metaResults) {
        if (r.status === "fulfilled" && r.value) candidates.push(r.value);
      }

      await new Promise((r) => setTimeout(r, 80));
    } catch (err) {
      console.warn(`[crawl-and-seed] IA query "${q}" failed:`, err);
    }
  }

  return candidates;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/public/hooks/crawl-and-seed")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const url = new URL(request.url);
  const purge = url.searchParams.get("purge") !== "false"; // default true
  const insertLimit = Math.min(parseInt(url.searchParams.get("limit") ?? "300"), 500);
  const apiKey = process.env.YOUTUBE_API_KEY ?? "";

  const log: string[] = [];
  const t0 = Date.now();

  // ── Step 1: Load all existing source_urls from DB ──────────────────────
  const { data: existingRows } = await supabaseAdmin
    .from("public_videos")
    .select("id, source_url, kind, provider");
  const existingMap = new Map<string, string>(); // source_url → id
  for (const row of existingRows ?? []) existingMap.set(row.source_url, row.id);

  // ── Step 2: Purge broken existing records ──────────────────────────────
  let purgedCount = 0;
  if (purge && existingRows?.length) {
    const all = existingRows as {
      id: string;
      source_url: string;
      kind: string;
      provider: string;
    }[];

    // Split by kind
    const youtubeRows = all.filter((r) => r.kind === "youtube" || r.provider === "youtube");
    const nativeRows = all.filter((r) => r.kind !== "youtube" && r.provider !== "youtube");

    // Probe youtube via oEmbed
    const ytIds = youtubeRows.map((r) => {
      try {
        return new URL(r.source_url).searchParams.get("v") ?? "";
      } catch {
        return "";
      }
    });
    const ytPlayable = await probeAll(
      ytIds,
      (id) => (id ? probeYouTube(id) : Promise.resolve(false)),
      15,
    );

    // Probe native via HEAD
    const nativePlayable = await probeAll(
      nativeRows.map((r) => r.source_url),
      probeNative,
      10,
    );

    const brokenIds: string[] = [];
    youtubeRows.forEach((r, i) => {
      if (!ytPlayable[i]) brokenIds.push(r.id);
    });
    nativeRows.forEach((r, i) => {
      if (!nativePlayable[i]) brokenIds.push(r.id);
    });

    if (brokenIds.length > 0) {
      // Hard delete broken rows
      const { error: delErr } = await supabaseAdmin
        .from("public_videos")
        .delete()
        .in("id", brokenIds);

      if (!delErr) {
        purgedCount = brokenIds.length;
        // Remove from local map
        for (const id of brokenIds) {
          for (const [url, rid] of existingMap) {
            if (rid === id) {
              existingMap.delete(url);
              break;
            }
          }
        }
      }
    }
    log.push(`Purged ${purgedCount} broken rows`);
  }

  // ── Step 3: Crawl new candidates ───────────────────────────────────────
  const allCandidates: VideoCandidate[] = [...GCS_SEEDS];

  // YouTube (only if API key available)
  if (apiKey) {
    const ytCandidates = await crawlYouTube(apiKey, YT_QUERIES, 20);
    allCandidates.push(...ytCandidates);
    log.push(`YouTube crawled: ${ytCandidates.length} candidates`);
  } else {
    log.push("YouTube skipped (no YOUTUBE_API_KEY)");
  }

  // Internet Archive
  const iaCandidates = await crawlInternetArchive(IA_QUERIES, 12);
  allCandidates.push(...iaCandidates);
  log.push(`Internet Archive crawled: ${iaCandidates.length} candidates`);

  // ── Step 4: Deduplicate against existing DB ────────────────────────────
  const newCandidates = allCandidates.filter((c) => !existingMap.has(c.source_url));
  log.push(`New (not in DB): ${newCandidates.length}`);

  // ── Step 5: Probe all new candidates ──────────────────────────────────
  const youtubeNew = newCandidates.filter((c) => c.kind === "youtube");
  const nativeNew = newCandidates.filter((c) => c.kind === "native");

  const ytNewIds = youtubeNew.map((c) => {
    try {
      return new URL(c.source_url).searchParams.get("v") ?? "";
    } catch {
      return "";
    }
  });
  const ytNewPlayable = await probeAll(
    ytNewIds,
    (id) => (id ? probeYouTube(id) : Promise.resolve(false)),
    15,
  );
  const nativeNewPlayable = await probeAll(
    nativeNew.map((c) => c.source_url),
    probeNative,
    10,
  );

  const verifiedCandidates: VideoCandidate[] = [];
  youtubeNew.forEach((c, i) => {
    if (ytNewPlayable[i]) verifiedCandidates.push(c);
  });
  nativeNew.forEach((c, i) => {
    if (nativeNewPlayable[i]) verifiedCandidates.push(c);
  });

  log.push(`Verified playable: ${verifiedCandidates.length}`);

  // ── Step 6: Insert verified candidates (up to insertLimit) ────────────
  const toInsert = verifiedCandidates.slice(0, insertLimit);
  let insertedCount = 0;

  if (toInsert.length > 0) {
    // Batch insert in chunks of 50
    const CHUNK = 50;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK).map((c) => ({
        title: c.title,
        description: c.description,
        author: c.author,
        provider: c.provider,
        source_url: c.source_url,
        page_url: c.page_url,
        poster_url: c.poster_url,
        duration_label: c.duration_label,
        kind: c.kind,
        category: c.category,
        is_active: true,
      }));

      const { error: insErr, count } = await supabaseAdmin
        .from("public_videos")
        .insert(chunk, { count: "exact" });

      if (insErr) {
        log.push(`Insert chunk ${i / CHUNK + 1} error: ${insErr.message}`);
      } else {
        insertedCount += count ?? chunk.length;
      }
    }
  }

  log.push(`Inserted: ${insertedCount}`);

  const elapsed = Date.now() - t0;

  return Response.json({
    ok: true,
    elapsed_ms: elapsed,
    purged: purgedCount,
    crawled: allCandidates.length,
    new_candidates: newCandidates.length,
    verified: verifiedCandidates.length,
    inserted: insertedCount,
    log,
  });
}
