import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
}

const DEFAULT_QUERY = "movies trailers documentaries music videos short films";
const DISCOVERY_CACHE_TTL_MS = 10 * 60 * 1000;
const DISCOVERY_FETCH_TIMEOUT_MS = 8_000;
const QUERY_VARIANTS_PER_REQUEST = 4;
const RESULT_LINK_LIMIT = 10;

const discoveryCache = new Map<string, { expiresAt: number; videos: DiscoveredVideo[] }>();

const discoveryInputSchema = z.object({
  query: z.string().trim().max(120).optional().default(DEFAULT_QUERY),
  cursor: z.number().int().min(0).optional().default(0),
  limit: z.number().int().min(1).max(12).optional().default(6),
});

function hashSeed(input: string) {
  return [...input].reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 17), 0);
}

function createPosterDataUri(title: string, category: VideoCategory, provider: string) {
  const palette: Record<VideoCategory, [string, string]> = {
    Cinema: ["#0f172a", "#2563eb"],
    Series: ["#111827", "#7c3aed"],
    Docs: ["#052e16", "#16a34a"],
  };
  const [start, end] = palette[category];
  const safeTitle = title.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const safeProvider = provider.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#g)" />
      <text x="80" y="116" fill="rgba(255,255,255,0.68)" font-size="34" font-family="Arial, sans-serif" letter-spacing="6">NEXUS DISCOVERY</text>
      <text x="80" y="350" fill="#ffffff" font-size="68" font-weight="700" font-family="Arial, sans-serif">${safeTitle}</text>
      <text x="80" y="426" fill="rgba(255,255,255,0.78)" font-size="28" font-family="Arial, sans-serif">${category} · ${safeProvider}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function inferCategory(text: string): VideoCategory {
  const normalized = text.toLowerCase();
  if (/(documentary|interview|explainer|behind the scenes|lecture|science|nature)/.test(normalized)) {
    return "Docs";
  }
  if (/(episode|series|season|clip|show|shorts|short)/.test(normalized)) {
    return "Series";
  }
  return "Cinema";
}

function inferDurationLabel(url: string) {
  const normalized = url.toLowerCase();
  if (normalized.includes("5s")) return "5s";
  if (normalized.includes("10s")) return "10s";
  if (normalized.includes("15s")) return "15s";
  if (normalized.includes("20s")) return "20s";
  if (normalized.includes("30s")) return "30s";
  return "Live web";
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractDuckDuckGoLinks(html: string) {
  const links: string[] = [];
  const regex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const rawHref = decodeHtml(match[1]);
    const normalized = normalizeSearchResultUrl(rawHref);
    if (normalized) links.push(normalized);
  }

  return Array.from(new Set(links));
}

function normalizeSearchResultUrl(rawHref: string) {
  try {
    const absolute = rawHref.startsWith("//") ? `https:${rawHref}` : rawHref;
    const url = new URL(absolute);

    if (url.hostname.includes("duckduckgo.com")) {
      const uddg = url.searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|ogv)(?:$|\?)/i.test(url);
}

function extractMetaContent(html: string, attr: string, key: string) {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  return regex.exec(html)?.[1] ? decodeHtml(regex.exec(html)?.[1] ?? "") : null;
}

function extractTitle(html: string) {
  const ogTitle = extractMetaContent(html, "property", "og:title") ?? extractMetaContent(html, "name", "twitter:title");
  if (ogTitle) return normalizeWhitespace(ogTitle);

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return titleMatch?.[1] ? normalizeWhitespace(decodeHtml(titleMatch[1])) : null;
}

function extractDirectSourcesFromHtml(html: string, pageUrl: string) {
  const discovered = new Set<string>();
  const sourceRegexes = [
    /<meta[^>]+property=["']og:video(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:player:stream["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<source[^>]+src=["']([^"']+)["'][^>]*>/gi,
    /<video[^>]+src=["']([^"']+)["'][^>]*>/gi,
  ];

  for (const regex of sourceRegexes) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      try {
        const absolute = new URL(decodeHtml(match[1]), pageUrl).toString();
        if (isDirectVideoUrl(absolute)) discovered.add(absolute);
      } catch {
        /* ignore malformed candidates */
      }
    }
  }

  return Array.from(discovered);
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DISCOVERY_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...init?.headers,
      },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyVideoSource(url: string) {
  try {
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        Range: "bytes=0-1",
        accept: "video/*,*/*;q=0.8",
      },
    });
    const type = response.headers.get("content-type")?.toLowerCase() ?? "";

    return response.ok && (type.startsWith("video/") || isDirectVideoUrl(url));
  } catch {
    return false;
  }
}

async function resolvePlayableVideo(pageUrl: string): Promise<DiscoveredVideo | null> {
  const provider = (() => {
    try {
      return new URL(pageUrl).hostname.replace(/^www\./, "");
    } catch {
      return "web";
    }
  })();

  const sourceCandidates = new Set<string>();
  let title = "";
  let description = "";

  if (isDirectVideoUrl(pageUrl)) {
    sourceCandidates.add(pageUrl);
    title = normalizeWhitespace(pageUrl.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ") ?? "Web video");
  } else {
    try {
      const response = await fetchWithTimeout(pageUrl);
      if (!response.ok) return null;

      const html = await response.text();
      title = extractTitle(html) ?? "Web video";
      description =
        extractMetaContent(html, "property", "og:description") ??
        extractMetaContent(html, "name", "description") ??
        "Verified from public web search.";

      for (const source of extractDirectSourcesFromHtml(html, pageUrl)) {
        sourceCandidates.add(source);
      }
    } catch {
      return null;
    }
  }

  const playableSources: string[] = [];
  for (const source of Array.from(sourceCandidates).slice(0, 3)) {
    if (await verifyVideoSource(source)) {
      playableSources.push(source);
    }
  }

  if (!playableSources.length) return null;

  const category = inferCategory(`${title} ${description}`);
  const finalTitle = title || "Web video";
  const poster = createPosterDataUri(finalTitle, category, provider);
  const id = `${provider}-${hashSeed(playableSources[0])}`;

  return {
    id,
    title: finalTitle,
    author: provider.replace(/\.[^.]+$/, "") || "web",
    description: normalizeWhitespace(description || "Verified from public web search."),
    poster,
    thumbnail: poster,
    pageUrl,
    sources: playableSources,
    durationLabel: inferDurationLabel(playableSources[0]),
    category,
    provider,
  };
}

function buildQueryVariants(query: string) {
  const base = query.trim() || DEFAULT_QUERY;
  return [
    // Primary video-focused queries
    `${base} mp4`,
    `${base} sample video`,
    `${base} trailer filetype:mp4`,
    `${base} demo video`,
    `${base} stock video`,
    // Specific video sites
    `${base} site:samplelib.com`,
    `${base} site:test-videos.co.uk mp4`,
    `${base} site:videvo.net`,
    `${base} site:pixabay.com videos`,
    `${base} site:pexels.com video`,
    `${base} site:coverr.co`,
    // Alternative formats
    `${base} filetype:webm`,
    `${base} filetype:mov`,
    `${base} video file`,
    // General fallbacks
    `${base} public video`,
    `${base} free video`,
    `${base} video download`,
    // Last resort generic
    `${base} video`,
    `sample video mp4`,
    `test video download`,
    `demo video clip`,
  ];
}

async function searchDuckDuckGo(query: string) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        accept: "text/html",
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    return extractDuckDuckGoLinks(html);
  } catch (error) {
    console.warn("DuckDuckGo search failed:", error);
    return [];
  }
}

async function searchBraveSearch(query: string) {
  try {
    const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        accept: "text/html",
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    // Extract links from Brave search results
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>/gi;
    const links: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = decodeHtml(match[1]);
      if (href.startsWith('http')) {
        links.push(href);
      }
    }
    return links;
  } catch (error) {
    console.warn("Brave search failed:", error);
    return [];
  }
}

async function searchStartpage(query: string) {
  try {
    const url = `https://www.startpage.com/do/search?query=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        accept: "text/html",
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    // Extract links from Startpage results
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*w-gl__result[^"]*"[^>]*>/gi;
    const links: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = decodeHtml(match[1]);
      if (href.startsWith('http') && !href.includes('startpage.com')) {
        links.push(href);
      }
    }
    return links;
  } catch (error) {
    console.warn("Startpage search failed:", error);
    return [];
  }
}

async function searchQwant(query: string) {
  try {
    const url = `https://www.qwant.com/?q=${encodeURIComponent(query)}&t=web`;
    const response = await fetchWithTimeout(url, {
      headers: {
        accept: "text/html",
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    // Extract links from Qwant results
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>/gi;
    const links: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = decodeHtml(match[1]);
      if (href.startsWith('http') && !href.includes('qwant.com')) {
        links.push(href);
      }
    }
    return links;
  } catch (error) {
    console.warn("Qwant search failed:", error);
    return [];
  }
}

// Fallback to known video sources
async function getKnownVideoSources(query: string) {
  const knownSources = [
    'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
    'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4',
  ];

  const results: DiscoveredVideo[] = [];
  const queryLower = query.toLowerCase();
  
  // Select relevant sources based on query
  const relevantSources = knownSources.filter((_, index) => {
    // Include first few always, then filter based on query relevance
    if (index < 5) return true;
    
    if (queryLower.includes('test') || queryLower.includes('sample')) return true;
    if (queryLower.includes('big') || queryLower.includes('bunny')) return index < 8;
    if (queryLower.includes('elephant') || queryLower.includes('dream')) return index === 6;
    if (queryLower.includes('sintel') || queryLower.includes('blender')) return index === 11;
    if (queryLower.includes('tears') || queryLower.includes('steel')) return index === 13;
    
    return Math.random() < 0.3; // Random selection for variety
  });

  for (const source of relevantSources.slice(0, 8)) {
    try {
      const video = await resolvePlayableVideo(source);
      if (video) {
        results.push(video);
      }
    } catch (error) {
      console.warn("Failed to resolve known source:", source, error);
    }
  }

  return results;
}

async function discoverVideos(query: string, limit: number) {
  const cacheKey = `${query.toLowerCase()}::${limit}`;
  const now = Date.now();
  const cached = discoveryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.videos;

  const variants = buildQueryVariants(query);
  const seenPages = new Set<string>();
  const discovered: DiscoveredVideo[] = [];
  const searchEngines = [
    { name: 'DuckDuckGo', search: searchDuckDuckGo },
    { name: 'Brave', search: searchBraveSearch },
    { name: 'Startpage', search: searchStartpage },
    { name: 'Qwant', search: searchQwant },
  ];

  // Try each search engine with fallbacks
  for (const searchEngine of searchEngines) {
    const engineVariants = variants.slice(0, QUERY_VARIANTS_PER_REQUEST);
    let engineFoundVideos = 0;

    for (const variant of engineVariants) {
      try {
        const links = await searchEngine.search(variant);
        for (const link of links.slice(0, RESULT_LINK_LIMIT)) {
          if (seenPages.has(link)) continue;
          seenPages.add(link);

          const video = await resolvePlayableVideo(link);
          if (!video) continue;

          if (!discovered.some((item) => item.sources[0] === video.sources[0])) {
            discovered.push(video);
            engineFoundVideos++;
          }

          if (discovered.length >= Math.max(limit * 2, 12)) break;
        }

        if (discovered.length >= Math.max(limit * 2, 12)) break;
      } catch (error) {
        console.warn(`Search engine ${searchEngine.name} failed for variant "${variant}":`, error);
      }
    }

    // If this engine found videos, move to next engine for variety
    if (engineFoundVideos > 0) {
      console.log(`${searchEngine.name} found ${engineFoundVideos} videos`);
    }

    if (discovered.length >= Math.max(limit * 2, 12)) break;
  }

  // If still not enough videos, try known sources as ultimate fallback
  if (discovered.length < limit) {
    console.log("Using known video sources as fallback");
    try {
      const fallbackVideos = await getKnownVideoSources(query);
      for (const video of fallbackVideos) {
        if (!discovered.some((item) => item.sources[0] === video.sources[0])) {
          discovered.push(video);
        }
      }
    } catch (error) {
      console.warn("Fallback to known sources failed:", error);
    }
  }

  // Final fallback - create generic videos if still not enough
  if (discovered.length < limit) {
    console.log("Creating generic fallback videos");
    const genericVideos = createGenericFallbackVideos(query, limit - discovered.length);
    discovered.push(...genericVideos);
  }

  discoveryCache.set(cacheKey, {
    expiresAt: now + DISCOVERY_CACHE_TTL_MS,
    videos: discovered,
  });

  console.log(`Discovery complete: found ${discovered.length} videos for query "${query}"`);
  return discovered;
}

// Create generic fallback videos when all else fails
function createGenericFallbackVideos(query: string, count: number): DiscoveredVideo[] {
  const fallbacks: DiscoveredVideo[] = [];
  const baseTitle = query.trim() || "Sample Video";
  
  for (let i = 0; i < count; i++) {
    const title = `${baseTitle} - Sample ${i + 1}`;
    const category = inferCategory(title);
    const poster = createPosterDataUri(title, category, "nexus");
    
    // Use reliable fallback sources
    const fallbackSources = [
      'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
    ];
    
    const source = fallbackSources[i % fallbackSources.length];
    const id = `nexus-fallback-${hashSeed(source + i)}`;
    
    fallbacks.push({
      id,
      title,
      author: "Nexus Discovery",
      description: `Generated fallback video for "${query}". This is a sample video for demonstration purposes.`,
      poster,
      thumbnail: poster,
      pageUrl: source,
      sources: [source],
      durationLabel: "Sample",
      category,
      provider: "nexus",
    });
  }
  
  return fallbacks;
}

export const fetchDiscoveredVideos = createServerFn({ method: "GET" })
  .inputValidator(discoveryInputSchema)
  .handler(async ({ data }) => {
    const { query, cursor, limit } = data;
    const results = await discoverVideos(query, limit);
    const page = results.slice(cursor, cursor + limit);

    return {
      videos: page,
      nextCursor: cursor + page.length,
      hasMore: cursor + page.length < results.length,
      query,
      fetchedAt: new Date().toISOString(),
    };
  });

export const DEFAULT_DISCOVERY_QUERY = DEFAULT_QUERY;
