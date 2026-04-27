CREATE TABLE public.social_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 280),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all comments"
  ON public.social_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments as themselves"
  ON public.social_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.social_comments FOR DELETE
  USING (auth.uid() = user_id);
