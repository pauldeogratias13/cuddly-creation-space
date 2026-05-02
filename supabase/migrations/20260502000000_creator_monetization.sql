-- ── Creator Monetization Features ─────────────────────────────────────
--
-- This migration adds:
--   1. creator_subscriptions table for paid subscriptions
--   2. creator_tiers table for subscription tiers
--   3. tips table for one-time donations
--   4. creator_earnings table for tracking revenue
--   5. gated_content table for subscriber-only content

-- ── 1. Creator Subscription Tiers ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  benefits JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_tiers_creator ON public.creator_tiers(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_tiers_active ON public.creator_tiers(creator_id, is_active);

-- ── 2. Creator Subscriptions ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.creator_tiers(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscriber_id, creator_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_subscriber ON public.creator_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_creator ON public.creator_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_active ON public.creator_subscriptions(active);

-- ── 3. Tips/Donations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tips_from_user ON public.tips(from_user_id);
CREATE INDEX IF NOT EXISTS idx_tips_to_user ON public.tips(to_user_id);
CREATE INDEX IF NOT EXISTS idx_tips_created ON public.tips(created_at);

-- ── 4. Gated Content ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'video', 'article', 'file')),
  content_url TEXT,
  content_text TEXT,
  thumbnail_url TEXT,
  access_level TEXT NOT NULL DEFAULT 'subscribers' CHECK (access_level IN ('subscribers', 'paid', 'custom')),
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gated_content_creator ON public.gated_content(creator_id);
CREATE INDEX IF NOT EXISTS idx_gated_content_active ON public.gated_content(is_active);

-- ── 5. Creator Earnings ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'tip', 'gated_content', 'brand_deal')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  reference_id UUID, -- Can reference subscription, tip, etc.
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator ON public.creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_type ON public.creator_earnings(type);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_created ON public.creator_earnings(created_at);

-- ── 6. Row Level Security Policies ─────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.creator_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- Creator tiers policies
CREATE POLICY "Anyone can view creator tiers"
  ON public.creator_tiers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Creators can manage their tiers"
  ON public.creator_tiers FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id);

-- Creator subscriptions policies
CREATE POLICY "Users can view their subscriptions"
  ON public.creator_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

CREATE POLICY "Users can subscribe"
  ON public.creator_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can manage their subscriptions"
  ON public.creator_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = subscriber_id);

-- Tips policies
CREATE POLICY "Users can view tips they sent or received"
  ON public.tips FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send tips"
  ON public.tips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Gated content policies
CREATE POLICY "Creators can manage their content"
  ON public.gated_content FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Subscribers can view gated content"
  ON public.gated_content FOR SELECT
  TO authenticated
  USING (
    creator_id IN (
      SELECT creator_id FROM public.creator_subscriptions
      WHERE subscriber_id = auth.uid() AND active = true
    ) OR auth.uid() = creator_id
  );

-- Creator earnings policies
CREATE POLICY "Creators can view their earnings"
  ON public.creator_earnings FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

-- ── 7. Functions ───────────────────────────────────────────────────────────

-- Function to get creator subscription stats
CREATE OR REPLACE FUNCTION public.get_creator_subscription_stats(creator_id UUID)
RETURNS TABLE (
  total_subscribers BIGINT,
  active_subscribers BIGINT,
  total_earnings DECIMAL(10,2),
  monthly_earnings DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE cs.active = true) AS total_subscribers,
    COUNT(*) FILTER (WHERE cs.active = true AND cs.current_period_end > NOW()) AS active_subscribers,
    COALESCE(SUM(ce.amount), 0) AS total_earnings,
    COALESCE(SUM(ce.amount) FILTER (WHERE ce.created_at >= DATE_TRUNC('month', NOW())), 0) AS monthly_earnings
  FROM public.creator_subscriptions cs
  LEFT JOIN public.creator_earnings ce ON cs.creator_id = ce.creator_id
  WHERE cs.creator_id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. Seed Data ───────────────────────────────────────────────────────────

-- Seed subscription tiers for demo creators
INSERT INTO public.creator_tiers (creator_id, name, description, price, currency, benefits)
SELECT
  '00000000-0000-0000-0000-000000000002', -- tech_reviewer
  'Tech Insider',
  'Early access to reviews and exclusive tech insights',
  4.99,
  'USD',
  '["Early access to reviews", "Exclusive tech insights", "Monthly Q&A", "Direct messages"]'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO public.creator_tiers (creator_id, name, description, price, currency, benefits)
SELECT
  '00000000-0000-0000-0000-000000000003', -- nature_films
  'Nature Explorer',
  'Behind-the-scenes access to nature filmmaking',
  7.99,
  'USD',
  '["Exclusive behind-the-scenes", "HD downloads", "Location guides", "Filming tips"]'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO public.creator_tiers (creator_id, name, description, price, currency, benefits)
SELECT
  '00000000-0000-0000-0000-000000000004', -- cooking_master
  'Culinary VIP',
  'Premium cooking classes and exclusive recipes',
  9.99,
  'USD',
  '["Live cooking classes", "Exclusive recipes", "Ingredient lists", "Technique tutorials"]'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;