CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('me', 'system')),
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.social_post_likes (
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.user_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_id TEXT NOT NULL CHECK (char_length(stream_id) BETWEEN 1 AND 64),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, stream_id)
);

CREATE TABLE public.nexos_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.gaming_scores (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  high_score INTEGER NOT NULL DEFAULT 0 CHECK (high_score >= 0),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexos_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaming_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all social posts"
  ON public.social_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create own social posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social posts"
  ON public.social_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social posts"
  ON public.social_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read all likes"
  ON public.social_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts as themselves"
  ON public.social_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
  ON public.social_post_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own watchlist"
  ON public.user_watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own watchlist"
  ON public.user_watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own watchlist entries"
  ON public.user_watchlist FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own NexOS apps"
  ON public.nexos_apps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own NexOS apps"
  ON public.nexos_apps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own NexOS apps"
  ON public.nexos_apps FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own gaming score"
  ON public.gaming_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own gaming score"
  ON public.gaming_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gaming score"
  ON public.gaming_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_social_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts
      SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts
      SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER social_post_likes_insert_trigger
AFTER INSERT ON public.social_post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_social_post_like_count();

CREATE TRIGGER social_post_likes_delete_trigger
AFTER DELETE ON public.social_post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_social_post_like_count();
