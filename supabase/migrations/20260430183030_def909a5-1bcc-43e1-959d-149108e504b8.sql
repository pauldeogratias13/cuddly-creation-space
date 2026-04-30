-- Sources to crawl (channel IDs or search queries)
CREATE TABLE public.youtube_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('channel', 'query')),
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Cinema',
  max_results INTEGER NOT NULL DEFAULT 10 CHECK (max_results BETWEEN 1 AND 50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, value)
);

ALTER TABLE public.youtube_sources ENABLE ROW LEVEL SECURITY;

-- Read-only to public; only service role writes (via cron handler)
CREATE POLICY "YouTube sources are viewable by everyone"
ON public.youtube_sources FOR SELECT USING (is_active = true);

-- Helpful index for the cron job
CREATE INDEX idx_public_videos_source_url ON public.public_videos (source_url);

-- Seed a few starter sources so the first cron run produces results
INSERT INTO public.youtube_sources (kind, value, category, max_results) VALUES
  ('channel', 'UCsT0YIqwnpJCM-mx7-gSA4Q', 'Docs',   15), -- TEDx Talks
  ('channel', 'UC4R8DWoMoI7CAwX8_LjQHig', 'Docs',   10), -- Linus Tech Tips
  ('channel', 'UCBJycsmduvYEL83R_U4JriQ', 'Docs',   10), -- MKBHD
  ('query',   'movie trailer 2026',       'Cinema', 15),
  ('query',   'lofi hip hop',             'Series', 10),
  ('query',   'short film',               'Cinema', 10);