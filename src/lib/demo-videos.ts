/**
 * 100 demo videos for TikTok-style feed
 * Using public sample videos from Google's storage bucket
 * Each entry has unique metadata for demo purposes
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

const videoSources = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
];

const thumbnails = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
];

const creators = [
  { name: "NEXUS_Official", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NEXUS" },
  { name: "TechVibes", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tech" },
  { name: "CinemaGold", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cinema" },
  { name: "AI_Creator", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AI" },
  { name: "StreamLife", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Stream" },
  { name: "DigitalNomad", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nomad" },
  { name: "FutureTech", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Future" },
  { name: "CodeWizard", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Code" },
  { name: "PixelArt", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel" },
  { name: "NeonGlow", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neon" },
];

const titles = [
  "Experience the Future of NEXUS",
  "AI-Powered Content Creation",
  "Behind the Scenes: NEXUS v4.0",
  "Streaming Redefined",
  "The Super-App Revolution",
  "Privacy First: Zero-Knowledge Architecture",
  "4K HDR Streaming Demo",
  "On-Device AI in Action",
  "NexOS App Ecosystem Tour",
  "Real-Time Collaboration Features",
  "E2E Encrypted Messaging Demo",
  "Social Feed: Intent-First Algorithm",
  "Gaming Hub Preview",
  "Commerce Integration Walkthrough",
  "Web Browse & Site Hosting",
  "Creator Economy Tools",
  "Watch Together Feature",
  "Spatial Audio Experience",
  "Adaptive Bitrate Streaming",
  "Cross-Platform Sync",
  "The Seven Pillars Explained",
  "NEXUS vs Traditional Apps",
  "Building Apps with NexOS",
  "AI Twin Personalization",
  "Reputation Graph System",
  "Micro-Communities Feature",
  "Evolving Content Trees",
  "Dolby Atmos Demo",
  "Cloud Gaming Stream",
  "Esports Tournament Mode",
  "NEXUS Mobile Experience",
  "Desktop Power User Features",
  "Offline-First Architecture",
  "Multi-Region Deployment",
  "Security Architecture Deep Dive",
  "DRM Protection Demo",
  "Forensic Watermarking",
  "Signal Protocol Integration",
  "Passkeys & WebAuthn",
  "Decentralized Identity",
  "TensorFlow Lite Models",
  "Core ML on iOS",
  "Media3 ExoPlayer Android",
  "Rust Feed Ranking Engine",
  "Go Microservices",
  "Kafka Event Streaming",
  "Redis Caching Layer",
  "PostgreSQL + pgvector",
  "Neo4j Social Graph",
  "ClickHouse Analytics",
  "ScyllaDB High Throughput",
  "Kubernetes Orchestration",
  "Cloudflare Edge Network",
  "Global CDN Performance",
  "VMAF Quality Gate",
  "AV1 Codec Efficiency",
  "HDR10+ Color Grading",
  "Bespoke App Commission",
  "In-App Browser Privacy",
  "Intent-Matching Ads",
  "Creator Monetization",
  "NEXUS Business Suite",
  "Team Collaboration",
  "White-Label Solutions",
  "API Access Tier",
  "Custom Domain Setup",
  "Analytics Dashboard",
  "Real-Time Notifications",
  "Smart Reply AI",
  "Live Transcription",
  "Translation Services",
  "AR Filters & Effects",
  "VR Content Preview",
  "360° Video Support",
  "Multi-Camera Angles",
  "Interactive Storytelling",
  "Live Polling Feature",
  "Q&A Sessions",
  "Audio-Only Mode",
  "Picture-in-Picture",
  "Background Play",
  "Download & Go",
  "Family Sharing",
  "Parental Controls",
  "Accessibility First",
  "Screen Reader Support",
  "Voice Commands",
  "Gesture Controls",
  "Haptic Feedback",
  "Dynamic Theming",
  "Dark Mode Optimized",
  "Battery Saver Mode",
  "Data Compression",
  "Low-Bandwidth Mode",
  "Progressive Web App",
  "Instant App Loading",
  "Smart Caching",
  "Predictive Prefetch",
  "User Journey Mapping",
  "A/B Testing Framework",
  "Feature Flag System",
  "Canary Deployments",
  "Blue-Green Deploy",
  "Disaster Recovery",
  "Backup & Sync",
];

const descriptions = [
  "Experience the next generation of digital interaction with NEXUS super-app platform.",
  "AI-powered content creation tools that understand your unique style and voice.",
  "Take a behind-the-scenes look at building the world's first true super-app.",
  "Cinema-quality streaming with adaptive bitrate and spatial audio technologies.",
  "One app to replace them all - chat, commerce, social, gaming, and streaming.",
  "Your data, your control. Zero-knowledge architecture puts privacy first.",
  "Stunning 4K HDR video streaming with Dolby Atmos surround sound experience.",
  "On-device AI processes your data locally for maximum privacy and speed.",
  "Build and deploy custom applications within the NEXUS ecosystem using NexOS.",
  "Real-time collaboration tools for teams, creators, and communities.",
];

function generateVideos(): DemoVideo[] {
  const videos: DemoVideo[] = [];
  
  for (let i = 0; i < 100; i++) {
    const sourceIndex = i % videoSources.length;
    const creatorIndex = i % creators.length;
    const titleIndex = i % titles.length;
    const descIndex = i % descriptions.length;
    const thumbIndex = i % thumbnails.length;
    
    videos.push({
      id: `video_${i + 1}`,
      title: `${titles[titleIndex]} #${i + 1}`,
      author: creators[creatorIndex].name,
      avatar: creators[creatorIndex].avatar,
      url: videoSources[sourceIndex],
      thumbnail: thumbnails[thumbIndex],
      likes: Math.floor(Math.random() * 100000) + 1000,
      comments: Math.floor(Math.random() * 5000) + 100,
      shares: Math.floor(Math.random() * 10000) + 500,
      description: descriptions[descIndex],
    });
  }
  
  return videos;
}

export const DEMO_VIDEOS = generateVideos();

export const DEMO_VIDEO_HERO_PREVIEW = videoSources[3];
