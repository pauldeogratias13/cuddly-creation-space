import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=120",
} as const;

type VideoHit = {
  id: string;
  title: string;
  description?: string;
  poster?: string;
  source: string;
  origin: "archive" | "gcs" | "coverr" | "w3" | "media";
  durationLabel?: string;
};

// Curated, license-free always-on CDN catalog (used as instant fallback while
// remote search runs — every URL is a real direct MP4 served with CORS).
const ALWAYS_ON: VideoHit[] = [
  {
    id: "gcs-bbb",
    title: "Big Buck Bunny",
    description: "Open movie by the Blender Foundation.",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    origin: "gcs",
    durationLabel: "9m 56s",
  },
  {
    id: "gcs-elephant",
    title: "Elephant's Dream",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
    origin: "gcs",
    durationLabel: "10m 53s",
  },
  {
    id: "gcs-sintel",
    title: "Sintel",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
    origin: "gcs",
    durationLabel: "14m 48s",
  },
  {
    id: "gcs-tears",
    title: "Tears of Steel",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
    origin: "gcs",
    durationLabel: "12m 14s",
  },
  {
    id: "gcs-volkswagen",
    title: "Volkswagen GTI Review",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg",
    origin: "gcs",
    durationLabel: "1m 0s",
  },
  {
    id: "gcs-fun",
    title: "For Bigger Fun",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
    origin: "gcs",
    durationLabel: "1m 0s",
  },
  {
    id: "gcs-escapes",
    title: "For Bigger Escapes",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
    origin: "gcs",
    durationLabel: "0m 15s",
  },
  {
    id: "gcs-meltdowns",
    title: "For Bigger Meltdowns",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg",
    origin: "gcs",
    durationLabel: "0m 15s",
  },
  {
    id: "w3-mp4",
    title: "W3C Demo · Bunny Trailer",
    source: "https://www.w3schools.com/html/mov_bbb.mp4",
    poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    origin: "w3",
    durationLabel: "0m 10s",
  },
];

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/** Verify a URL points at a real, fetchable video resource. */
async function verify(url: string): Promise<boolean> {
  try {
    // Try HEAD first (fastest)
    const head = await withTimeout(
      fetch(url, { method: "HEAD", redirect: "follow" }),
      4000,
    );
    if (head.ok) {
      const ct = head.headers.get("content-type") || "";
      if (ct.startsWith("video/") || ct.includes("octet-stream") || /\.mp4($|\?)/i.test(url)) {
        return true;
      }
    }
  } catch {
    /* fall through to ranged GET */
  }
  try {
    const res = await withTimeout(
      fetch(url, { method: "GET", headers: { Range: "bytes=0-1023" }, redirect: "follow" }),
      5000,
    );
    if (!res.ok && res.status !== 206) return false;
    const ct = res.headers.get("content-type") || "";
    return ct.startsWith("video/") || ct.includes("octet-stream") || /\.mp4($|\?)/i.test(url);
  } catch {
    return false;
  }
}

/**
 * Search the Internet Archive for free, directly-playable MP4s matching `q`.
 * Returns up to `limit` candidates with poster + a guessed direct URL.
 */
async function searchArchive(q: string, limit: number, page = 1): Promise<VideoHit[]> {
  const url =
    `https://archive.org/advancedsearch.php?` +
    `q=${encodeURIComponent(`(${q}) AND mediatype:(movies) AND format:(MPEG4 OR h.264 OR 512Kb MPEG4)`)}` +
    `&fl[]=identifier&fl[]=title&fl[]=description&fl[]=downloads` +
    `&sort[]=downloads desc&rows=${limit}&page=${page}&output=json`;

  const res = await withTimeout(fetch(url), 6000);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    response?: { docs?: { identifier: string; title?: string; description?: string }[] };
  };
  const docs = data.response?.docs ?? [];

  // For each doc, query the metadata endpoint to find an actual mp4 file.
  const hits = await Promise.all(
    docs.map(async (doc): Promise<VideoHit | null> => {
      try {
        const meta = await withTimeout(
          fetch(`https://archive.org/metadata/${doc.identifier}`),
          5000,
        );
        if (!meta.ok) return null;
        const json = (await meta.json()) as {
          files?: { name: string; format?: string; size?: string }[];
        };
        const files = json.files ?? [];
        // prefer mid-size mp4 (h.264) over 512kb to balance quality + load time
        const mp4 =
          files.find((f) => /\.mp4$/i.test(f.name) && f.format && /h\.?264/i.test(f.format)) ||
          files.find((f) => /\.mp4$/i.test(f.name));
        if (!mp4) return null;
        const poster =
          files.find((f) => /\.(jpg|jpeg|png)$/i.test(f.name) && /thumb|cover|still|001\./i.test(f.name)) ||
          files.find((f) => /\.(jpg|jpeg|png)$/i.test(f.name));
        const desc = typeof doc.description === "string"
          ? doc.description.replace(/<[^>]+>/g, "").slice(0, 240)
          : Array.isArray(doc.description)
            ? String(doc.description[0] ?? "").replace(/<[^>]+>/g, "").slice(0, 240)
            : undefined;
        return {
          id: `ia-${doc.identifier}`,
          title: doc.title || doc.identifier,
          description: desc,
          source: `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp4.name)}`,
          poster: poster
            ? `https://archive.org/download/${doc.identifier}/${encodeURIComponent(poster.name)}`
            : `https://archive.org/services/img/${doc.identifier}`,
          origin: "archive",
        };
      } catch {
        return null;
      }
    }),
  );

  return hits.filter((h): h is VideoHit => !!h);
}

function filterAlwaysOn(q: string): VideoHit[] {
  if (!q) return ALWAYS_ON;
  const needle = q.toLowerCase();
  const matches = ALWAYS_ON.filter((v) => v.title.toLowerCase().includes(needle));
  return matches.length ? matches : ALWAYS_ON;
}

export const Route = createFileRoute("/api/videos/search")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 12), 1), 24);
        const page = Math.min(Math.max(Number(url.searchParams.get("page") ?? 1), 1), 50);
        const skipRemote = url.searchParams.get("skipRemote") === "1";

        // Always-on CDN catalog only on page 1 to avoid duplicating it on scroll.
        const localHits = page === 1 ? filterAlwaysOn(q) : [];
        let remote: VideoHit[] = [];

        if (!skipRemote) {
          try {
            remote = await withTimeout(searchArchive(q || "feature film", limit, page), 9000);
          } catch {
            remote = [];
          }
        }

        // Combine + dedupe by source URL
        const seen = new Set<string>();
        const combined: VideoHit[] = [];
        for (const hit of [...localHits, ...remote]) {
          if (seen.has(hit.source)) continue;
          seen.add(hit.source);
          combined.push(hit);
        }

        // Verify in parallel; drop anything that fails. Local CDNs are trusted
        // and skipped to keep the response fast.
        const verified = await Promise.all(
          combined.map(async (hit) => {
            if (hit.origin !== "archive") return hit; // trusted CDN
            const ok = await verify(hit.source);
            return ok ? hit : null;
          }),
        );

        const results = verified.filter((h): h is VideoHit => !!h).slice(0, limit);

        return new Response(
          JSON.stringify({
            query: q,
            page,
            count: results.length,
            results,
            hasMore: results.length >= limit,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          },
        );
      },
    },
  },
});
