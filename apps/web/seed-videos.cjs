
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

console.log('STARTING SEED');

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env');
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

seed().then(() => {
  console.log('DONE');
  process.exit(0);
}).catch(err => {
  console.error('FAILED', err);
  process.exit(1);
});
