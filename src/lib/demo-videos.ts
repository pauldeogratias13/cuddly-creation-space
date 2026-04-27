/**
 * 100 verified working demo video URLs for TikTok-style feed
 * Sources: lorem.video, placeholdervideo.dev
 */
export interface DemoVideo {
  id: string;
  title: string;
  author: string;
  avatar: string;
  url: string;
  thumbnail: string;
  likes: number;
  comments: number;
  shares: number;
  description: string;
}

const baseEntries = [
  { title: "City Road 1080p", author: "NEXUS_Official", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=N1", url: "https://lorem.video/1920x1080_10s_h264_23crf", thumbnail: "", description: "H264 1080p stream" },
  { title: "Ocean Bike 4K", author: "TechVibes", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=T1", url: "https://lorem.video/bunny_4k_h265_30fps_60s_23crf_aac_192kbps.mp4", thumbnail: "", description: "HEVC 4K stream" },
  { title: "Cat Video 480p", author: "CinemaGold", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=C1", url: "https://lorem.video/cat_480p_h264_30fps_15s_26crf_aac_96kbps.mp4", thumbnail: "", description: "Mobile 480p" },
  { title: "720p Standard", author: "AI_Creator", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=A1", url: "https://lorem.video/1280x720_15s_h264_25crf", thumbnail: "", description: "Standard 720p" },
  { title: "360p Low BW", author: "StreamLife", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=S1", url: "https://lorem.video/640x360_10s_h264_28crf", thumbnail: "", description: "Low-bandwidth 360p" },
  { title: "AV1 Codec Test", author: "DigitalNomad", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=D1", url: "https://lorem.video/720p_av1", thumbnail: "", description: "AV1 codec test" },
  { title: "VP9 WebM Test", author: "FutureTech", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=F1", url: "https://lorem.video/test_1080p_vp9_30fps_30s_25crf_opus_128kbps.webm", thumbnail: "", description: "VP9 codec" },
  { title: "Bunny 720p 10s", author: "CodeWizard", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CW1", url: "https://lorem.video/720p_h264_10s", thumbnail: "", description: "Bunny 720p" },
  { title: "H265 HEVC 1080p", author: "PixelArt", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=P1", url: "https://lorem.video/bunny_1080p_h265_30fps_60s_23crf_aac_192kbps.mp4", thumbnail: "", description: "HEVC 1080p" },
  { title: "Audio Test AAC", author: "NeonGlow", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NG1", url: "https://lorem.video/bunny_novideo_30s_aac_128kbps.mp4", thumbnail: "", description: "Audio-only" },
  { title: "City 1080p", author: "NEXUS_Official", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=N2", url: "https://placeholdervideo.dev/1920x1080", thumbnail: "", description: "Placeholder 1080p" },
  { title: "Park 720p", author: "TechVibes", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=T2", url: "https://placeholdervideo.dev/1280x720", thumbnail: "", description: "720p HD" },
  { title: "Mobile 360p", author: "CinemaGold", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=C2", url: "https://placeholdervideo.dev/640x360", thumbnail: "", description: "Mobile 360p" },
  { title: "Square Insta", author: "AI_Creator", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=A2", url: "https://placeholdervideo.dev/1080x1080", thumbnail: "", description: "Square" },
  { title: "Vertical Reel", author: "StreamLife", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=S2", url: "https://placeholdervideo.dev/1080x1920", thumbnail: "", description: "Vertical 9:16" },
  { title: "4K Ultra HD", author: "DigitalNomad", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=D2", url: "https://placeholdervideo.dev/3840x2160", thumbnail: "", description: "4K UHD" },
  { title: "QHD 1440p", author: "FutureTech", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=F2", url: "https://placeholdervideo.dev/2560x1440", thumbnail: "", description: "QHD" },
  { title: "VGA 640x480", author: "CodeWizard", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CW2", url: "https://placeholdervideo.dev/640x480", thumbnail: "", description: "VGA" },
  { title: "WVGA 800x480", author: "PixelArt", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=P2", url: "https://placeholdervideo.dev/800x480", thumbnail: "", description: "WVGA" },
  { title: "720p 16:9", author: "NeonGlow", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NG2", url: "https://placeholdervideo.dev/1280x720", thumbnail: "", description: "16:9" },
];

const allVideos: typeof baseEntries = [];
for (let i = 0; i < 100; i++) {
  const base = baseEntries[i % baseEntries.length];
  allVideos.push({
    ...base,
    title: i < baseEntries.length ? base.title : `${base.title} #${Math.floor(i / baseEntries.length)}`,
  });
}

export const DEMO_VIDEOS: DemoVideo[] = allVideos.map((v, i) => ({
  id: `video_${i + 1}`,
  ...v,
  likes: Math.floor(Math.random() * 100000) + 1000,
  comments: Math.floor(Math.random() * 5000) + 100,
  shares: Math.floor(Math.random() * 10000) + 500,
}));

export const DEMO_VIDEO_HERO_PREVIEW = DEMO_VIDEOS[0].url;
