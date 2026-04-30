-- Video Storage Schema for Verified Working Videos

-- Table to store verified video URLs with metadata
CREATE TABLE IF NOT EXISTS verified_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  duration_seconds INTEGER,
  file_size BIGINT,
  content_type TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  source_domain TEXT NOT NULL,
  provider TEXT NOT NULL,
  page_url TEXT,
  verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('verified', 'failed', 'pending')),
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_attempts INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track video verification attempts and results
CREATE TABLE IF NOT EXISTS video_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES verified_videos(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
  response_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store video sources and their reliability scores
CREATE TABLE IF NOT EXISTS video_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  reliability_score DECIMAL(3,2) DEFAULT 1.0 CHECK (reliability_score >= 0 AND reliability_score <= 1),
  total_videos INTEGER DEFAULT 0,
  verified_videos INTEGER DEFAULT 0,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scraping_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track scraping sessions
CREATE TABLE IF NOT EXISTS scraping_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES video_sources(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  videos_found INTEGER DEFAULT 0,
  videos_verified INTEGER DEFAULT 0,
  videos_failed INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  config JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verified_videos_url ON verified_videos(url);
CREATE INDEX IF NOT EXISTS idx_verified_videos_category ON verified_videos(category);
CREATE INDEX IF NOT EXISTS idx_verified_videos_source_domain ON verified_videos(source_domain);
CREATE INDEX IF NOT EXISTS idx_verified_videos_verification_status ON verified_videos(verification_status);
CREATE INDEX IF NOT EXISTS idx_verified_videos_last_verified ON verified_videos(last_verified_at);
CREATE INDEX IF NOT EXISTS idx_verified_videos_is_active ON verified_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_verified_videos_tags ON verified_videos USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_video_verification_logs_video_id ON video_verification_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_video_verification_logs_verified_at ON video_verification_logs(verified_at);

CREATE INDEX IF NOT EXISTS idx_video_sources_domain ON video_sources(domain);
CREATE INDEX IF NOT EXISTS idx_video_sources_reliability ON video_sources(reliability_score);
CREATE INDEX IF NOT EXISTS idx_video_sources_is_active ON video_sources(is_active);

CREATE INDEX IF NOT EXISTS idx_scraping_sessions_source_id ON scraping_sessions(source_id);
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_status ON scraping_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_started_at ON scraping_sessions(started_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update timestamps
CREATE TRIGGER update_verified_videos_updated_at BEFORE UPDATE ON verified_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_sources_updated_at BEFORE UPDATE ON video_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial video sources
INSERT INTO video_sources (domain, name, reliability_score) VALUES
('archive.org', 'Internet Archive', 0.95),
('commons.wikimedia.org', 'Wikimedia Commons', 0.90),
('samplelib.com', 'Sample Library', 0.85),
('test-videos.co.uk', 'Test Videos UK', 0.80),
('commondatastorage.googleapis.com', 'Google Cloud Storage', 0.95),
('www.w3schools.com', 'W3Schools', 0.75),
('pixabay.com', 'Pixabay Videos', 0.85),
('pexels.com', 'Pexels Videos', 0.85),
('videvo.net', 'Videvo', 0.80),
('coverr.co', 'Coverr', 0.80)
ON CONFLICT (domain) DO NOTHING;
