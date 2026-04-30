-- ── Social video anchors: unique constraint + like-count trigger ─────────
--
-- 1. Add a unique constraint on social_posts.text so that upsert
--    onConflict:'text' works correctly when creating video anchor rows.
--
-- 2. Add a trigger that automatically increments / decrements
--    social_posts.likes_count whenever a row is inserted or deleted in
--    social_post_likes, so the count is always accurate and real-time
--    subscriptions on social_posts receive the UPDATE event.
--
-- 3. Ensure unauthenticated visitors can read posts and comments
--    (so like/comment counts are visible to everyone).

-- 1. Unique index on post text (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS social_posts_text_unique
  ON public.social_posts (text);

-- 2. Like-count trigger function
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop old trigger if it exists, then recreate
DROP TRIGGER IF EXISTS trg_post_likes_count ON public.social_post_likes;

CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON public.social_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- 3. Ensure anonymous users can read posts and comments
--    (policies are created only if they don't already exist)
DO $$
BEGIN
  -- social_posts: public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'social_posts'
      AND policyname = 'Anyone can read posts'
  ) THEN
    CREATE POLICY "Anyone can read posts"
      ON public.social_posts FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- social_comments: public read (may already exist)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'social_comments'
      AND policyname = 'Anyone can read comments'
  ) THEN
    CREATE POLICY "Anyone can read comments"
      ON public.social_comments FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END;
$$;
