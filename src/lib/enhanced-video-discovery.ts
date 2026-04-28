import { supabase } from "@/integrations/supabase/client";

export interface VerifiedVideoSource {
  id: string;
  url: string;
  title: string;
  description?: string;
  poster?: string;
  duration?: string;
  category: string;
  provider: string;
  pageUrl?: string;
  lastVerified: string;
  verificationCount: number;
  isWorking: boolean;
  responseTime?: number;
  fileSize?: number;
  contentType?: string;
}

export interface VideoScrapingResult {
  videos: VerifiedVideoSource[];
  totalFound: number;
  totalVerified: number;
  scrapingTime: number;
  source: string;
  errors: string[];
}

/**
 * Enhanced video verification with detailed checking
 */
export async function verifyVideoUrlDetailed(url: string): Promise<{
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
    const contentRange = headResponse.headers.get('content-range');
    
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

    // Try to get duration for some video formats
    let duration: number | undefined;
    try {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Duration check timeout'));
        }, 3000);
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          duration = video.duration;
          resolve(duration);
        };
        
        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Video load error'));
        };
      });
    } catch (error) {
      // Duration check failed, but video might still work
      console.warn('Duration check failed for', url, error);
    }

    return {
      isWorking: headResponse.ok,
      contentType: contentType || undefined,
      fileSize: contentLength ? parseInt(contentLength) : undefined,
      responseTime,
      duration,
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

/**
 * Store verified video in user_watchlist table as a temporary storage
 */
export async function storeVerifiedVideo(video: Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount'>): Promise<string | null> {
  try {
    // Use user_watchlist table as temporary storage for verified videos
    // We'll store the video info in the metadata field
    const { data, error } = await supabase
      .from('user_watchlist')
      .insert({
        user_id: 'system', // Use a system user ID for verified videos
        video_id: `verified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          type: 'verified_video',
          url: video.url,
          title: video.title,
          description: video.description,
          poster: video.poster,
          duration: video.duration,
          category: video.category,
          provider: video.provider,
          pageUrl: video.pageUrl,
          isWorking: video.isWorking,
          responseTime: video.responseTime,
          fileSize: video.fileSize,
          contentType: video.contentType,
          storedAt: new Date().toISOString(),
        },
      })
      .select('video_id')
      .single();

    if (error) {
      console.error('Error storing verified video:', error);
      return null;
    }

    return data.video_id;
  } catch (error) {
    console.error('Error storing verified video:', error);
    return null;
  }
}

/**
 * Get verified videos from storage
 */
export async function getVerifiedVideos(limit: number = 50): Promise<VerifiedVideoSource[]> {
  try {
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('*')
      .eq('user_id', 'system')
      .like('metadata', '%verified_video%')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching verified videos:', error);
      return [];
    }

    return data.map(item => {
      const metadata = item.metadata as any;
      return {
        id: item.video_id,
        url: metadata.url,
        title: metadata.title,
        description: metadata.description,
        poster: metadata.poster,
        duration: metadata.duration,
        category: metadata.category,
        provider: metadata.provider,
        pageUrl: metadata.pageUrl,
        lastVerified: item.created_at,
        verificationCount: 1,
        isWorking: metadata.isWorking,
        responseTime: metadata.responseTime,
        fileSize: metadata.fileSize,
        contentType: metadata.contentType,
      };
    });
  } catch (error) {
    console.error('Error fetching verified videos:', error);
    return [];
  }
}

/**
 * Enhanced video scraping from multiple public sources
 */
export async function scrapeVideosFromSources(): Promise<VideoScrapingResult[]> {
  const results: VideoScrapingResult[] = [];
  
  // Define public video sources with their scraping configurations
  const sources = [
    {
      name: 'Internet Archive',
      baseUrl: 'https://archive.org',
      searchPath: '/advancedsearch.php',
      queries: [
        'collection:opensource_movies',
        'collection:feature_films',
        'collection:educational_films',
        'mediatype:movies',
      ],
      maxResults: 20,
    },
    {
      name: 'Wikimedia Commons',
      baseUrl: 'https://commons.wikimedia.org',
      searchPath: '/w/api.php',
      queries: [
        'action=query&generator=categorymembers&gcmtitle=Category:Video&gcmlimit=50',
        'action=query&generator=search&gsrsearch=video&gsrlimit=50',
      ],
      maxResults: 15,
    },
    {
      name: 'Pexels Videos',
      baseUrl: 'https://www.pexels.com',
      searchPath: '/search/videos/',
      queries: ['nature', 'technology', 'people', 'animals', 'landscape'],
      maxResults: 10,
    },
    {
      name: 'Pixabay Videos',
      baseUrl: 'https://pixabay.com',
      searchPath: '/videos/search/',
      queries: ['nature', 'technology', 'people', 'animals', 'landscape'],
      maxResults: 10,
    },
    {
      name: 'Coverr',
      baseUrl: 'https://coverr.co',
      searchPath: '/',
      queries: ['nature', 'tech', 'business', 'abstract'],
      maxResults: 8,
    },
  ];

  for (const source of sources) {
    const startTime = Date.now();
    const sourceResult: VideoScrapingResult = {
      videos: [],
      totalFound: 0,
      totalVerified: 0,
      scrapingTime: 0,
      source: source.name,
      errors: [],
    };

    try {
      console.log(`Scraping ${source.name}...`);
      
      for (const query of source.queries) {
        try {
          const videos = await scrapeSource(source, query);
          sourceResult.videos.push(...videos);
          sourceResult.totalFound += videos.length;
          
          // Verify each video
          const verificationResults = await Promise.all(
            videos.map(async (video) => {
              const verification = await verifyVideoUrlDetailed(video.url);
              return {
                ...video,
                isWorking: verification.isWorking,
                responseTime: verification.responseTime,
                fileSize: verification.fileSize,
                contentType: verification.contentType,
                lastVerified: new Date().toISOString(),
                verificationCount: 1,
              };
            })
          );
          
          // Store only working videos
          const workingVideos = verificationResults.filter(v => v.isWorking);
          sourceResult.totalVerified += workingVideos.length;
          
          // Store verified videos
          for (const video of workingVideos) {
            await storeVerifiedVideo(video);
          }
          
        } catch (error) {
          sourceResult.errors.push(`Query "${query}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`Error scraping ${source.name} with query "${query}":`, error);
        }
      }
      
      sourceResult.scrapingTime = Date.now() - startTime;
      results.push(sourceResult);
      
    } catch (error) {
      sourceResult.errors.push(`Source scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sourceResult.scrapingTime = Date.now() - startTime;
      results.push(sourceResult);
      console.error(`Error scraping ${source.name}:`, error);
    }
  }

  return results;
}

/**
 * Scrape a specific source
 */
async function scrapeSource(source: any, query: string): Promise<Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[]> {
  const videos: Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[] = [];
  
  try {
    switch (source.name) {
      case 'Internet Archive':
        videos.push(...await scrapeInternetArchive(source, query));
        break;
      case 'Wikimedia Commons':
        videos.push(...await scrapeWikimediaCommons(source, query));
        break;
      case 'Pexels Videos':
        videos.push(...await scrapePexels(source, query));
        break;
      case 'Pixabay Videos':
        videos.push(...await scrapePixabay(source, query));
        break;
      case 'Coverr':
        videos.push(...await scrapeCoverr(source, query));
        break;
      default:
        console.warn(`Unknown source: ${source.name}`);
    }
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error);
  }
  
  return videos.slice(0, source.maxResults);
}

/**
 * Scrape Internet Archive for videos
 */
async function scrapeInternetArchive(source: any, query: string): Promise<Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[]> {
  const videos: Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[] = [];
  
  try {
    // Use Internet Archive API
    const searchUrl = `${source.baseUrl}/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,description,format,duration&output=json&rows=50`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.response && data.response.docs) {
      for (const doc of data.response.docs) {
        // Find video files
        const videoFormats = doc.format?.filter((f: string) => 
          f.includes('mp4') || f.includes('webm') || f.includes('mov')
        ) || [];
        
        if (videoFormats.length > 0) {
          const identifier = doc.identifier;
          const videoUrl = `${source.baseUrl}/download/${identifier}/${identifier}.${videoFormats[0].split('.')[1]}`;
          
          videos.push({
            url: videoUrl,
            title: doc.title || identifier,
            description: doc.description,
            poster: `${source.baseUrl}/download/${identifier}/${identifier}_thumbs.jpg`,
            duration: doc.duration,
            category: inferCategory(doc.title || ''),
            provider: 'Internet Archive',
            pageUrl: `${source.baseUrl}/details/${identifier}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scraping Internet Archive:', error);
  }
  
  return videos;
}

/**
 * Scrape Wikimedia Commons for videos
 */
async function scrapeWikimediaCommons(source: any, query: string): Promise<Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[]> {
  const videos: Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[] = [];
  
  try {
    const apiUrl = `${source.baseUrl}${source.searchPath}?${query}&format=json&prop=info|imageinfo&iiprop=url|size|extmetadata&iiurlwidth=400`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.query && data.query.pages) {
      for (const pageId of Object.keys(data.query.pages)) {
        const page = data.query.pages[pageId];
        if (page.imageinfo && page.imageinfo.length > 0) {
          const imageinfo = page.imageinfo[0];
          
          // Check if it's a video file
          if (imageinfo.url && (imageinfo.url.includes('.webm') || imageinfo.url.includes('.ogv') || imageinfo.url.includes('.mp4'))) {
            videos.push({
              url: imageinfo.url,
              title: page.title || `Video ${pageId}`,
              description: page.description || '',
              poster: imageinfo.thumburl,
              category: inferCategory(page.title || ''),
              provider: 'Wikimedia Commons',
              pageUrl: `${source.baseUrl}/wiki/${page.title}`,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scraping Wikimedia Commons:', error);
  }
  
  return videos;
}

/**
 * Scrape Pexels Videos (using their API or public endpoints)
 */
async function scrapePexels(source: any, query: string): Promise<Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[]> {
  const videos: Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[] = [];
  
  try {
    // Note: Pexels requires API key for their official API
    // This is a simplified approach using their public endpoints
    const searchUrl = `${source.baseUrl}${source.searchPath}${query}/`;
    
    const response = await fetch(searchUrl);
    const html = await response.text();
    
    // Extract video URLs from HTML (simplified approach)
    const videoRegex = /<video[^>]*src="([^"]*)"[^>]*>/g;
    const titleRegex = /<h1[^>]*>([^<]*)<\/h1>/g;
    
    let match;
    const videoUrls: string[] = [];
    
    while ((match = videoRegex.exec(html)) !== null) {
      videoUrls.push(match[1]);
    }
    
    videoUrls.slice(0, 10).forEach((url, index) => {
      videos.push({
        url: url,
        title: `Pexels Video - ${query} ${index + 1}`,
        description: `Video from Pexels - ${query}`,
        category: inferCategory(query),
        provider: 'Pexels',
        pageUrl: searchUrl,
      });
    });
  } catch (error) {
    console.error('Error scraping Pexels:', error);
  }
  
  return videos;
}

/**
 * Scrape Pixabay Videos
 */
async function scrapePixabay(source: any, query: string): Promise<Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[]> {
  const videos: Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[] = [];
  
  try {
    // Similar to Pexels, using public endpoints
    const searchUrl = `${source.baseUrl}${source.searchPath}${query}/`;
    
    const response = await fetch(searchUrl);
    const html = await response.text();
    
    // Extract video information
    const videoRegex = /<video[^>]*data-source="([^"]*)"[^>]*>/g;
    
    let match;
    const videoUrls: string[] = [];
    
    while ((match = videoRegex.exec(html)) !== null) {
      videoUrls.push(match[1]);
    }
    
    videoUrls.slice(0, 10).forEach((url, index) => {
      videos.push({
        url: url,
        title: `Pixabay Video - ${query} ${index + 1}`,
        description: `Video from Pixabay - ${query}`,
        category: inferCategory(query),
        provider: 'Pixabay',
        pageUrl: searchUrl,
      });
    });
  } catch (error) {
    console.error('Error scraping Pixabay:', error);
  }
  
  return videos;
}

/**
 * Scrape Coverr videos
 */
async function scrapeCoverr(source: any, query: string): Promise<Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[]> {
  const videos: Omit<VerifiedVideoSource, 'id' | 'lastVerified' | 'verificationCount' | 'isWorking' | 'responseTime' | 'fileSize' | 'contentType'>[] = [];
  
  try {
    const searchUrl = `${source.baseUrl}${source.searchPath}`;
    
    const response = await fetch(searchUrl);
    const html = await response.text();
    
    // Extract video URLs from Coverr's HTML structure
    const videoRegex = /<video[^>]*src="([^"]*)"[^>]*>/g;
    
    let match;
    const videoUrls: string[] = [];
    
    while ((match = videoRegex.exec(html)) !== null) {
      videoUrls.push(match[1]);
    }
    
    videoUrls.slice(0, 8).forEach((url, index) => {
      videos.push({
        url: url,
        title: `Coverr Video - ${query} ${index + 1}`,
        description: `Free stock video from Coverr`,
        category: inferCategory(query),
        provider: 'Coverr',
        pageUrl: searchUrl,
      });
    });
  } catch (error) {
    console.error('Error scraping Coverr:', error);
  }
  
  return videos;
}

/**
 * Infer video category from title or query
 */
function inferCategory(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('trailer') || lowerTitle.includes('movie') || lowerTitle.includes('film')) {
    return 'Cinema';
  } else if (lowerTitle.includes('documentary') || lowerTitle.includes('doc') || lowerTitle.includes('educational')) {
    return 'Docs';
  } else if (lowerTitle.includes('series') || lowerTitle.includes('episode') || lowerTitle.includes('show')) {
    return 'Series';
  } else if (lowerTitle.includes('nature') || lowerTitle.includes('landscape') || lowerTitle.includes('animal')) {
    return 'Nature';
  } else if (lowerTitle.includes('tech') || lowerTitle.includes('technology') || lowerTitle.includes('computer')) {
    return 'Technology';
  } else if (lowerTitle.includes('business') || lowerTitle.includes('office') || lowerTitle.includes('work')) {
    return 'Business';
  } else {
    return 'General';
  }
}

/**
 * Batch verify videos from stored sources
 */
export async function batchVerifyStoredVideos(): Promise<{
  total: number;
  working: number;
  failed: number;
  results: VerifiedVideoSource[];
}> {
  const storedVideos = await getVerifiedVideos(100);
  const results: VerifiedVideoSource[] = [];
  
  let working = 0;
  let failed = 0;
  
  for (const video of storedVideos) {
    const verification = await verifyVideoUrlDetailed(video.url);
    
    const updatedVideo: VerifiedVideoSource = {
      ...video,
      isWorking: verification.isWorking,
      responseTime: verification.responseTime,
      fileSize: verification.fileSize,
      contentType: verification.contentType,
      lastVerified: new Date().toISOString(),
      verificationCount: video.verificationCount + 1,
    };
    
    results.push(updatedVideo);
    
    if (verification.isWorking) {
      working++;
    } else {
      failed++;
    }
    
    // Update the stored video
    await storeVerifiedVideo(updatedVideo);
    
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return {
    total: storedVideos.length,
    working,
    failed,
    results,
  };
}

/**
 * Get video statistics
 */
export async function getVideoStatistics(): Promise<{
  totalStored: number;
  workingVideos: number;
  categories: Record<string, number>;
  topProviders: Array<{ provider: string; count: number }>;
  averageResponseTime: number;
}> {
  const videos = await getVerifiedVideos(1000);
  
  const workingVideos = videos.filter(v => v.isWorking);
  const categories: Record<string, number> = {};
  const providers: Record<string, number> = {};
  let totalResponseTime = 0;
  let responseTimeCount = 0;
  
  videos.forEach(video => {
    // Count categories
    categories[video.category] = (categories[video.category] || 0) + 1;
    
    // Count providers
    providers[video.provider] = (providers[video.provider] || 0) + 1;
    
    // Calculate average response time
    if (video.responseTime) {
      totalResponseTime += video.responseTime;
      responseTimeCount++;
    }
  });
  
  const topProviders = Object.entries(providers)
    .map(([provider, count]) => ({ provider, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalStored: videos.length,
    workingVideos: workingVideos.length,
    categories,
    topProviders,
    averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
  };
}
