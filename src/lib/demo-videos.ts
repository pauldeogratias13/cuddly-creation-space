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

export const DEFAULT_DISCOVERY_QUERY = "movies trailers documentaries music videos short films";

export async function fetchDiscoveredVideos() {
  return {
    videos: [] as DiscoveredVideo[],
    nextCursor: 0,
    hasMore: false,
  };
}