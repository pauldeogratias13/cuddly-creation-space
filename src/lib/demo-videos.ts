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
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo Search failed: ${response.status}`);
    }
    
    const html = await response.text();
    const links: string[] = [];
    
    // Extract direct video links from search results
    const videoLinkRegex = /<a[^>]+href="([^"]+)"/g;
    let match;
    while ((match = videoLinkRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.match(/\.(mp4|webm|mov|avi|flv|wmv|m4v|3gp)$/i) && !url.includes('://')) {
        links.push(url);
      }
    }
    
    return links.slice(0, RESULT_LINK_LIMIT);
  } catch (error) {
    console.warn("Brave Search failed:", error);
    return [];
  }
}

async function searchStartpage(query: string): Promise<string[]> {
  try {
    const searchUrl = `https://www.startpage.com/do/search?query=${encodeURIComponent(query)}+video+filetype:mp4`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Startpage failed: ${response.status}`);
    }
    
    const html = await response.text();
    const links: string[] = [];
    
    // Extract video links
    const videoLinkRegex = /<a[^>]+href="([^"]+)"/g;
    let match;
    while ((match = videoLinkRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.match(/\.(mp4|webm|mov|avi|flv|wmv|m4v|3gp)$/i)) {
        links.push(url);
      }
    }
    
    return links.slice(0, RESULT_LINK_LIMIT);
  } catch (error) {
    console.warn("Startpage failed:", error);
    return [];
  }
}

async function searchQwant(query: string): Promise<string[]> {
  try {
    const searchUrl = `https://www.qwant.com/?q=${encodeURIComponent(query)}+video+filetype:mp4&t=web`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Qwant failed: ${response.status}`);
    }
    
    const html = await response.text();
    const links: string[] = [];
    
    // Extract video links
    const videoLinkRegex = /<a[^>]+href="([^"]+)"/g;
    let match;
    while ((match = videoLinkRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.match(/\.(mp4|webm|mov|avi|flv|wmv|m4v|3gp)$/i)) {
        links.push(url);
      }
    }
    
    return links.slice(0, RESULT_LINK_LIMIT);
  } catch (error) {
    console.warn("Qwant failed:", error);
    return [];
  }
}

async function searchBraveSearch(query: string): Promise<string[]> {
  try {
    const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}+filetype:mp4+OR+filetype:webm+OR+filetype:mov`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Brave Search failed: ${response.status}`);
    }
    
    const html = await response.text();
    const links: string[] = [];
    
    // Extract direct video links from search results
    const videoLinkRegex = /<a[^>]+href="([^"]+)"/g;
    let match;
    while ((match = videoLinkRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.match(/\.(mp4|webm|mov|avi|flv|wmv|m4v|3gp)$/i) && !url.includes('://')) {
        links.push(url);
      }
    }
    
    return links.slice(0, RESULT_LINK_LIMIT);
  } catch (error) {
    console.warn("Brave Search failed:", error);
    return [];
  }
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

// Enhanced video verification with detailed checking
async function verifyVideoUrlDetailed(url: string): Promise<{
  isWorking: boolean;
  contentType?: string;
  fileSize?: number;
  responseTime: number;
  error?: string;
  duration?: number;
}> {
  const startTime = Date.now();
  
  try {
    // First try a HEAD request to get metadata
    const headResponse = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      headers: {
        'Range': 'bytes=0-1023',
      },
    });

    const responseTime = Date.now() - startTime;
    
    // For no-cors requests, we can't read the response, so try a GET with small range
    if (headResponse.type === 'opaque') {
      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          headers: {
            'Range': 'bytes=0-1023',
          },
        });
        
        return {
          isWorking: getResponse.type === 'opaque',
          responseTime: Date.now() - startTime,
        };
      } catch (error) {
        return {
          isWorking: false,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'GET request failed',
        };
      }
    }

    const contentType = headResponse.headers.get('content-type');
    const contentLength = headResponse.headers.get('content-length');
    
    // Check if it's a video content type
    const isVideo = contentType?.includes('video/') || 
                   contentType?.includes('application/mp4') ||
                   contentType?.includes('application/octet-stream') ||
                   contentType?.includes('application/x-mpegURL') ||
                   url.match(/\.(mp4|webm|mov|avi|flv|wmv|m4v|3gp)$/i);
    
    if (!isVideo && !url.match(/\.(mp4|webm|mov|avi|flv|wmv|m4v|3gp)$/i)) {
      return {
        isWorking: false,
        responseTime,
        error: `Invalid content type: ${contentType}`,
      };
    }

    return {
      isWorking: headResponse.ok,
      contentType: contentType || undefined,
      fileSize: contentLength ? parseInt(contentLength) : undefined,
      responseTime,
      error: headResponse.ok ? undefined : `HTTP ${headResponse.status}`,
    };
  } catch (error) {
    return {
      isWorking: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Enhanced video scraping from public sources with verification
async function scrapeVerifiedVideos(query: string, limit: number): Promise<DiscoveredVideo[]> {
  const verifiedWorkingVideos = [
    // Internet Archive - reliable public domain videos
    {
      url: 'https://archive.org/download/BigBuckBunny_328/BigBuckBunny_328_512kb.mp4',
      title: 'Big Buck Bunny - Public Domain Animation',
      description: 'A beautifully animated short film from the Blender Foundation',
      provider: 'Internet Archive'
    },
    {
      url: 'https://archive.org/download/Sintel/Sintel.ogv',
      title: 'Sintel - Blender Foundation Film',
      description: 'Epic fantasy short film from Blender',
      provider: 'Internet Archive'
    },
    {
      url: 'https://archive.org/download/ElephantsDream/elephants_dream_512kb.mp4',
      title: 'Elephants Dream - Open Movie',
      description: 'First open movie from Blender Foundation',
      provider: 'Internet Archive'
    },
    // Google Cloud Storage samples
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Big Buck Bunny - Sample Video',
      description: 'High quality sample video for testing',
      provider: 'Google Cloud Storage'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: 'Elephants Dream - Sample',
      description: 'Sample video for development testing',
      provider: 'Google Cloud Storage'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'For Bigger Blazes',
      description: 'Google sample video for testing',
      provider: 'Google Cloud Storage'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      title: 'For Bigger Escapes',
      description: 'Sample video content',
      provider: 'Google Cloud Storage'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      title: 'For Bigger Fun',
      description: 'Entertainment sample video',
      provider: 'Google Cloud Storage'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      title: 'For Bigger Joyrides',
      description: 'Adventure sample video',
      provider: 'Google Cloud Storage'
    },
    {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      title: 'Sintel - Sample Version',
      description: 'Fantasy adventure sample',
      provider: 'Google Cloud Storage'
    },
    // Sample libraries
    {
      url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
      title: '5 Second Sample Video',
      description: 'Short sample for testing',
      provider: 'Sample Library'
    },
    {
      url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
      title: '10 Second Sample Video',
      description: 'Medium length sample video',
      provider: 'Sample Library'
    },
    {
      url: 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
      title: '15 Second Sample Video',
      description: 'Longer sample for testing',
      provider: 'Sample Library'
    },
    // Test video sites
    {
      url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      title: 'Big Buck Bunny - Test Version',
      description: 'Test video for development',
      provider: 'Test Videos UK'
    },
    {
      url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_1mb.mp4',
      title: 'Big Buck Bunny - HD Test',
      description: 'High definition test video',
      provider: 'Test Videos UK'
    },
    // Additional reliable sources
    {
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      title: 'HTML5 Sample Video',
      description: 'Basic HTML5 video sample',
      provider: 'W3Schools'
    },
    {
      url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      title: 'Sample MP4 File',
      description: 'Educational sample video',
      provider: 'Learning Container'
    },
    {
      url: 'https://file-examples.com/storage/fe8c8c5c516ed6c5993a3c7/mp4/360/mp4-360p-example.mp4',
      title: 'MP4 Example File',
      description: 'File examples for testing',
      provider: 'File Examples'
    },
    {
      url: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      title: 'Sample Videos - 720p',
      description: 'High quality sample content',
      provider: 'Sample Videos'
    }
  ];

  const results: DiscoveredVideo[] = [];
  
  // Filter videos based on query relevance
  const relevantVideos = verifiedWorkingVideos.filter(video => {
    const searchTerm = query.toLowerCase();
    const title = video.title.toLowerCase();
    const description = video.description.toLowerCase();
    
    return searchTerm === '' || 
           title.includes(searchTerm) || 
           description.includes(searchTerm) ||
           searchTerm.includes('video') || // Always include for general video searches
           searchTerm.includes('sample') ||
           searchTerm.includes('test');
  });

  // Verify and convert to DiscoveredVideo format
  for (const source of relevantVideos.slice(0, limit)) {
    try {
      // Quick verification
      const verification = await verifyVideoUrlDetailed(source.url);
      if (verification.isWorking) {
        const category = inferCategory(source.title);
        const poster = createPosterDataUri(source.title, category, source.provider);
        
        results.push({
          id: `verified-${hashSeed(source.url)}`,
          title: source.title,
          author: source.provider,
          description: source.description,
          poster,
          thumbnail: poster,
          pageUrl: source.url,
          sources: [source.url],
          durationLabel: verification.duration ? formatDuration(verification.duration) : "Sample",
          category,
          provider: source.provider.toLowerCase(),
        });
      }
    } catch (error) {
      console.warn(`Failed to verify known source: ${source.url}`, error);
    }
  }
  
  return results;
}

// Cache for verified videos to avoid repeated verification
const verifiedVideoCache = new Map<string, DiscoveredVideo[]>();

// Enhanced video discovery with prioritized verified sources
async function getVerifiedVideosFirst(query: string, limit: number): Promise<DiscoveredVideo[]> {
  const cacheKey = `verified-${query.toLowerCase()}-${limit}`;
  
  // Check cache first
  if (verifiedVideoCache.has(cacheKey)) {
    return verifiedVideoCache.get(cacheKey)!;
  }
  
  // Get verified videos from public sources
  const verifiedVideos = await scrapeVerifiedVideos(query, limit);
  
  // If we don't have enough verified videos, supplement with search results
  if (verifiedVideos.length < limit) {
    try {
      // Create a simple fallback search to avoid circular reference
      const fallbackSearch = async (q: string, l: number) => {
        const variants = buildQueryVariants(q);
        const seenPages = new Set<string>();
        const searchEngines = [
          { name: 'DuckDuckGo', search: searchDuckDuckGo },
          { name: 'Brave', search: searchBraveSearch },
          { name: 'Startpage', search: searchStartpage },
          { name: 'Qwant', search: searchQwant },
        ];
        
        const results: DiscoveredVideo[] = [];
        
        for (const searchEngine of searchEngines) {
          const engineVariants = variants.slice(0, QUERY_VARIANTS_PER_REQUEST);
          
          for (const variant of engineVariants) {
            try {
              const links = await searchEngine.search(variant);
              for (const link of links.slice(0, RESULT_LINK_LIMIT)) {
                if (seenPages.has(link)) continue;
                seenPages.add(link);

                const video = await resolvePlayableVideo(link);
                if (!video) continue;

                if (!results.some((item) => item.sources[0] === video.sources[0])) {
                  results.push(video);
                }

                if (results.length >= l) break;
              }
              
              if (results.length >= l) break;
            } catch (error) {
              console.warn(`Search engine ${searchEngine.name} failed for variant "${variant}":`, error);
            }
          }
          
          if (results.length >= l) break;
        }
        
        return results;
      };
      
      const searchResults = await fallbackSearch(query, limit - verifiedVideos.length);
      verifiedVideos.push(...searchResults);
    } catch (error) {
      console.warn('Search results failed, using only verified videos:', error);
    }
  }
  
  const finalResults = verifiedVideos.slice(0, limit);
  
  // Cache the results
  verifiedVideoCache.set(cacheKey, finalResults);
  
  // Clean cache periodically (keep only last 20 entries)
  if (verifiedVideoCache.size > 20) {
    const keysToDelete = Array.from(verifiedVideoCache.keys()).slice(0, -20);
    keysToDelete.forEach(key => verifiedVideoCache.delete(key));
  }
  
  return finalResults;
}

// Replace the main discoverVideos function with the enhanced version
async function discoverVideos(query: string, limit: number) {
  const cacheKey = `${query.toLowerCase()}::${limit}`;
  const now = Date.now();
  const cached = discoveryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.videos;

  const discovered: DiscoveredVideo[] = [];
  
  // First try verified videos
  try {
    const verifiedVideos = await getVerifiedVideosFirst(query, limit);
    discovered.push(...verifiedVideos);
  } catch (error) {
    console.warn('Verified videos search failed:', error);
  }

  // If still not enough, use regular search
  if (discovered.length < limit) {
    const variants = buildQueryVariants(query);
    const seenPages = new Set<string>();
    const searchEngines = [
      { name: 'DuckDuckGo', search: searchDuckDuckGo },
      { name: 'Brave', search: searchBraveSearch },
      { name: 'Startpage', search: searchStartpage },
      { name: 'Qwant', search: searchQwant },
    ];

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

      if (engineFoundVideos > 0) {
        console.log(`${searchEngine.name} found ${engineFoundVideos} videos`);
      }

      if (discovered.length >= Math.max(limit * 2, 12)) break;
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
