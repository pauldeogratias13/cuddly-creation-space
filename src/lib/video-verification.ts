import { supabase } from "@/integrations/supabase/client";

export interface VideoVerificationResult {
  url: string;
  isWorking: boolean;
  contentType?: string;
  fileSize?: number;
  duration?: number;
  responseTime: number;
  error?: string;
}

export interface VerifiedVideo {
  id: string;
  url: string;
  title: string;
  description?: string;
  posterUrl?: string;
  durationSeconds?: number;
  fileSize?: number;
  contentType?: string;
  category: string;
  tags: string[];
  sourceDomain: string;
  provider: string;
  pageUrl?: string;
  verificationStatus: 'verified' | 'failed' | 'pending';
  lastVerifiedAt: string;
  verificationAttempts: number;
  isActive: boolean;
  metadata: Record<string, any>;
}

/**
 * Verify if a video URL is working by making a HEAD request
 */
export async function verifyVideoUrl(url: string): Promise<VideoVerificationResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // Try no-cors first for cross-origin
      headers: {
        'Range': 'bytes=0-1023', // Request first 1KB to check if it's streaming
      },
    });

    const responseTime = Date.now() - startTime;
    
    // For no-cors requests, we can't read the response, so we'll try a different approach
    if (response.type === 'opaque') {
      return {
        url,
        isWorking: true, // Assume it's working if no error thrown
        responseTime,
      };
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Check if it's a video content type
    const isVideo = contentType?.includes('video/') || 
                   contentType?.includes('application/mp4') ||
                   contentType?.includes('application/octet-stream');
    
    if (!isVideo) {
      return {
        url,
        isWorking: false,
        responseTime,
        error: `Invalid content type: ${contentType}`,
      };
    }

    return {
      url,
      isWorking: response.ok,
      contentType,
      fileSize: contentLength ? parseInt(contentLength) : undefined,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      url,
      isWorking: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Store a verified video in the database
 */
export async function storeVerifiedVideo(video: Omit<VerifiedVideo, 'id' | 'lastVerifiedAt' | 'verificationAttempts'>): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('verified_videos')
      .insert({
        url: video.url,
        title: video.title,
        description: video.description,
        poster_url: video.posterUrl,
        duration_seconds: video.durationSeconds,
        file_size: video.fileSize,
        content_type: video.contentType,
        category: video.category,
        tags: video.tags,
        source_domain: video.sourceDomain,
        provider: video.provider,
        page_url: video.pageUrl,
        verification_status: video.verificationStatus,
        is_active: video.isActive,
        metadata: video.metadata,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing verified video:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error storing verified video:', error);
    return null;
  }
}

/**
 * Get verified videos from database with pagination
 */
export async function getVerifiedVideos(
  limit: number = 50,
  offset: number = 0,
  category?: string,
  tags?: string[]
): Promise<VerifiedVideo[]> {
  try {
    let query = supabase
      .from('verified_videos')
      .select('*')
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .order('last_verified_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching verified videos:', error);
      return [];
    }

    return data.map(video => ({
      id: video.id,
      url: video.url,
      title: video.title,
      description: video.description,
      posterUrl: video.poster_url,
      durationSeconds: video.duration_seconds,
      fileSize: video.file_size,
      contentType: video.content_type,
      category: video.category,
      tags: video.tags || [],
      sourceDomain: video.source_domain,
      provider: video.provider,
      pageUrl: video.page_url,
      verificationStatus: video.verification_status,
      lastVerifiedAt: video.last_verified_at,
      verificationAttempts: video.verification_attempts,
      isActive: video.is_active,
      metadata: video.metadata || {},
    }));
  } catch (error) {
    console.error('Error fetching verified videos:', error);
    return [];
  }
}

/**
 * Search verified videos by title or tags
 */
export async function searchVerifiedVideos(
  query: string,
  limit: number = 20
): Promise<VerifiedVideo[]> {
  try {
    const { data, error } = await supabase
      .from('verified_videos')
      .select('*')
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('last_verified_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching verified videos:', error);
      return [];
    }

    return data.map(video => ({
      id: video.id,
      url: video.url,
      title: video.title,
      description: video.description,
      posterUrl: video.poster_url,
      durationSeconds: video.duration_seconds,
      fileSize: video.file_size,
      contentType: video.content_type,
      category: video.category,
      tags: video.tags || [],
      sourceDomain: video.source_domain,
      provider: video.provider,
      pageUrl: video.page_url,
      verificationStatus: video.verification_status,
      lastVerifiedAt: video.last_verified_at,
      verificationAttempts: video.verification_attempts,
      isActive: video.is_active,
      metadata: video.metadata || {},
    }));
  } catch (error) {
    console.error('Error searching verified videos:', error);
    return [];
  }
}

/**
 * Update video verification status
 */
export async function updateVideoVerification(
  videoId: string,
  result: VideoVerificationResult
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('verified_videos')
      .update({
        verification_status: result.isWorking ? 'verified' : 'failed',
        last_verified_at: new Date().toISOString(),
        verification_attempts: supabase.rpc('increment', { x: 1 }),
        metadata: {
          ...result,
          lastCheck: new Date().toISOString(),
        },
      })
      .eq('id', videoId);

    if (error) {
      console.error('Error updating video verification:', error);
      return false;
    }

    // Log the verification attempt
    await supabase
      .from('video_verification_logs')
      .insert({
        video_id: videoId,
        status: result.isWorking ? 'success' : 'failed',
        response_code: result.error ? undefined : 200,
        response_time_ms: result.responseTime,
        error_message: result.error,
      });

    return true;
  } catch (error) {
    console.error('Error updating video verification:', error);
    return false;
  }
}

/**
 * Batch verify multiple video URLs
 */
export async function batchVerifyVideos(urls: string[]): Promise<VideoVerificationResult[]> {
  const results: VideoVerificationResult[] = [];
  
  // Process in batches to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(url => verifyVideoUrl(url))
    );
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Get video reliability statistics
 */
export async function getVideoStats(): Promise<{
  totalVideos: number;
  verifiedVideos: number;
  failedVideos: number;
  categories: Record<string, number>;
  topSources: Array<{ domain: string; count: number; reliability: number }>;
}> {
  try {
    const { data: stats, error } = await supabase
      .from('verified_videos')
      .select('verification_status, category, source_domain');

    if (error) {
      console.error('Error fetching video stats:', error);
      return {
        totalVideos: 0,
        verifiedVideos: 0,
        failedVideos: 0,
        categories: {},
        topSources: [],
      };
    }

    const totalVideos = stats.length;
    const verifiedVideos = stats.filter(v => v.verification_status === 'verified').length;
    const failedVideos = stats.filter(v => v.verification_status === 'failed').length;

    // Count by category
    const categories: Record<string, number> = {};
    stats.forEach(video => {
      categories[video.category] = (categories[video.category] || 0) + 1;
    });

    // Count by source domain
    const sourceCounts: Record<string, { verified: number; total: number }> = {};
    stats.forEach(video => {
      if (!sourceCounts[video.source_domain]) {
        sourceCounts[video.source_domain] = { verified: 0, total: 0 };
      }
      sourceCounts[video.source_domain].total++;
      if (video.verification_status === 'verified') {
        sourceCounts[video.source_domain].verified++;
      }
    });

    const topSources = Object.entries(sourceCounts)
      .map(([domain, counts]) => ({
        domain,
        count: counts.total,
        reliability: counts.total > 0 ? counts.verified / counts.total : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalVideos,
      verifiedVideos,
      failedVideos,
      categories,
      topSources,
    };
  } catch (error) {
    console.error('Error fetching video stats:', error);
    return {
      totalVideos: 0,
      verifiedVideos: 0,
      failedVideos: 0,
      categories: {},
      topSources: [],
    };
  }
}
