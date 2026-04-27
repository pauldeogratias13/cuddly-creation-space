/**
 * Public sample MP4s for QA / demos (Google hosted, widely used for player testing).
 * Replace with your own CDN URLs in production.
 */
export const DEMO_VIDEOS = {
  bigBuckBunny:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  sintel:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  elephantsDream:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  forBiggerBlazes:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
} as const;

export const DEMO_VIDEO_HERO_PREVIEW = DEMO_VIDEOS.forBiggerBlazes;
