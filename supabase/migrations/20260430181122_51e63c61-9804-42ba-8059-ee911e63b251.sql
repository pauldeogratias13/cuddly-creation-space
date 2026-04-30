-- Create public videos catalog table for curated, freely-usable video content
CREATE TABLE IF NOT EXISTS public.public_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  provider TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  poster_url TEXT,
  page_url TEXT,
  kind TEXT NOT NULL DEFAULT 'native' CHECK (kind IN ('native','youtube')),
  category TEXT NOT NULL DEFAULT 'Cinema',
  duration_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.public_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public videos are viewable by everyone"
ON public.public_videos
FOR SELECT
USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_public_videos_active_sort ON public.public_videos(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_public_videos_category ON public.public_videos(category);

CREATE TRIGGER update_public_videos_updated_at
BEFORE UPDATE ON public.public_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();