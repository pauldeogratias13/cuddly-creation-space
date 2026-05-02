
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

console.log('STARTING SEED');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GCS_SEEDS = [
  {
    title: "Big Buck Bunny",
    description: "Open animated film by Blender Foundation.",
    author: "Blender Foundation",
    provider: "Google CDN",
    kind: "native",
    category: "Cinema",
    source_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    is_active: true
  },
  {
    title: "Sintel",
    description: "Blender Foundation open movie about a girl and her dragon.",
    author: "Blender Foundation",
    provider: "Google CDN",
    kind: "native",
    category: "Cinema",
    source_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    poster_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
    is_active: true
  }
];

async function seed() {
  console.log('Seeding videos...');
  const { data, error } = await supabase
    .from('public_videos')
    .insert(GCS_SEEDS);

  if (error) {
    console.error('Error seeding videos:', error);
  } else {
    console.log('Successfully seeded videos');
  }
}

seed();
