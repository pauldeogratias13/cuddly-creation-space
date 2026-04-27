export interface DemoVideo {
  id: string;
  title: string;
  author: string;
  avatar: string;
  sources: string[];
  poster: string;
  thumbnail: string;
  likes: number;
  comments: number;
  shares: number;
  description: string;
  durationLabel: string;
  category: "Cinema" | "Series" | "Docs";
}

type DemoSeed = {
  slug: string;
  title: string;
  author: string;
  description: string;
  poster: string;
  category: DemoVideo["category"];
  durationLabel: string;
  sources: string[];
};

const DEMO_SEEDS: DemoSeed[] = [
  {
    slug: "big-buck-bunny",
    title: "Big Buck Bunny",
    author: "NEXUS_Official",
    description: "Open demo film used as a reliable default playback test.",
    poster: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
    category: "Cinema",
    durationLabel: "9m 56s",
    sources: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    ],
  },
  {
    slug: "elephants-dream",
    title: "Elephant's Dream",
    author: "CinemaGold",
    description: "Stylized open movie for full-screen playback and player controls.",
    poster: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
    category: "Cinema",
    durationLabel: "10m 53s",
    sources: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    ],
  },
  {
    slug: "for-bigger-blazes",
    title: "For Bigger Blazes",
    author: "StreamLife",
    description: "Short promo clip for quick player health checks and faster loading.",
    poster: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
    category: "Series",
    durationLabel: "15s",
    sources: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    ],
  },
  {
    slug: "for-bigger-escapes",
    title: "For Bigger Escape",
    author: "DigitalNomad",
    description: "Compact test asset with a second CDN fallback source.",
    poster: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
    category: "Series",
    durationLabel: "15s",
    sources: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    ],
  },
  {
    slug: "for-bigger-fun",
    title: "For Bigger Fun",
    author: "AI_Creator",
    description: "Bright test footage used for autoplay, mute, and resume behavior.",
    poster: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
    category: "Docs",
    durationLabel: "1m",
    sources: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    ],
  },
  {
    slug: "for-bigger-joyrides",
    title: "For Bigger Joyrides",
    author: "TechVibes",
    description: "Promo-style sample clip for the carousel and watchlist flows.",
    poster: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg",
    category: "Docs",
    durationLabel: "15s",
    sources: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    ],
  },
];

function hashSeed(input: string) {
  return [...input].reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 17), 0);
}

function metric(seed: string, min: number, span: number) {
  return min + (hashSeed(seed) % span);
}

export const DEMO_VIDEOS: DemoVideo[] = Array.from({ length: 18 }, (_, index) => {
  const seed = DEMO_SEEDS[index % DEMO_SEEDS.length];
  const variant = Math.floor(index / DEMO_SEEDS.length);
  const title = variant === 0 ? seed.title : `${seed.title} Cut ${variant + 1}`;
  const id = `${seed.slug}-${index + 1}`;
  const seedKey = `${seed.slug}-${index}`;

  return {
    id,
    title,
    author: variant === 0 ? seed.author : `${seed.author}_${variant + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seedKey)}`,
    sources: seed.sources,
    poster: seed.poster,
    thumbnail: seed.poster,
    likes: metric(`${seedKey}-likes`, 1500, 85000),
    comments: metric(`${seedKey}-comments`, 80, 6000),
    shares: metric(`${seedKey}-shares`, 30, 12000),
    description: seed.description,
    durationLabel: seed.durationLabel,
    category: seed.category,
  };
});

export const STREAM_LIBRARY = DEMO_VIDEOS.slice(0, 6).map((video, index) => ({
  id: `stream-${index + 1}`,
  title: video.title,
  category: video.category,
  duration: video.durationLabel,
  videoSources: video.sources,
  poster: video.poster,
  description: video.description,
}));

export const DEMO_VIDEO_HERO_PREVIEW = DEMO_VIDEOS[0];
