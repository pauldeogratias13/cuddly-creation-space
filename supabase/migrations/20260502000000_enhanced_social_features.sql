-- Enhanced Social Features Migration
-- Adds missing tables for bookmarks, polls, stories, spaces, forks, and more

-- 1. Update social_posts table to support new features
ALTER TABLE public.social_posts 
ADD COLUMN IF NOT EXISTS intent_tag TEXT CHECK (intent_tag IN ('all', 'learn', 'chill', 'explore', 'create', 'shop')),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fork_depth INTEGER NOT NULL DEFAULT 0 CHECK (fork_depth >= 0),
ADD COLUMN IF NOT EXISTS fork_parent_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS domain_tag TEXT,
ADD COLUMN IF NOT EXISTS reputation_score INTEGER CHECK (reputation_score >= 0 AND reputation_score <= 100);

-- 2. Create social_post_bookmarks table
CREATE TABLE IF NOT EXISTS public.social_post_bookmarks (
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.social_post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks"
  ON public.social_post_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON public.social_post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.social_post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create social_polls table
CREATE TABLE IF NOT EXISTS public.social_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 1 AND 200),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id)
);

-- 4. Create social_poll_options table
CREATE TABLE IF NOT EXISTS public.social_poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.social_polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  votes_count INTEGER NOT NULL DEFAULT 0 CHECK (votes_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_poll_options ENABLE ROW LEVEL SECURITY;

-- Poll policies
CREATE POLICY "Users can read all polls"
  ON public.social_polls FOR SELECT
  USING (true);

CREATE POLICY "Users can create polls on own posts"
  ON public.social_polls FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.social_posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can read all poll options"
  ON public.social_poll_options FOR SELECT
  USING (true);

-- 5. Create social_poll_votes table
CREATE TABLE IF NOT EXISTS public.social_poll_votes (
  poll_id UUID NOT NULL REFERENCES public.social_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.social_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, user_id),
  UNIQUE(option_id, user_id)
);

ALTER TABLE public.social_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all poll votes"
  ON public.social_poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote once per poll"
  ON public.social_poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own poll votes"
  ON public.social_poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create social_stories table
CREATE TABLE IF NOT EXISTS public.social_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT CHECK (char_length(caption) BETWEEN 1 AND 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.social_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all active stories"
  ON public.social_stories FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Users can create own stories"
  ON public.social_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON public.social_stories FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create social_story_views table
CREATE TABLE IF NOT EXISTS public.social_story_views (
  story_id UUID NOT NULL REFERENCES public.social_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE public.social_story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own story views"
  ON public.social_story_views FOR SELECT
  USING (auth.uid() = viewer_id);

CREATE POLICY "Users can create story view records"
  ON public.social_story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- 8. Create community_spaces table
CREATE TABLE IF NOT EXISTS public.community_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) BETWEEN 1 AND 500),
  emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 10),
  topic TEXT NOT NULL CHECK (char_length(topic) BETWEEN 1 AND 200),
  intent_tag TEXT NOT NULL CHECK (intent_tag IN ('all', 'learn', 'chill', 'explore', 'create', 'shop')),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_live BOOLEAN NOT NULL DEFAULT FALSE,
  member_count INTEGER NOT NULL DEFAULT 1 CHECK (member_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community spaces are viewable by everyone"
  ON public.community_spaces FOR SELECT
  USING (true);

CREATE POLICY "Users can create community spaces"
  ON public.community_spaces FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own spaces"
  ON public.community_spaces FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own spaces"
  ON public.community_spaces FOR DELETE
  USING (auth.uid() = creator_id);

-- 9. Create community_space_members table
CREATE TABLE IF NOT EXISTS public.community_space_members (
  space_id UUID NOT NULL REFERENCES public.community_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id)
);

ALTER TABLE public.community_space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Space membership is viewable by space members"
  ON public.community_space_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.community_space_members 
            WHERE space_id = community_space_members.space_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can join spaces"
  ON public.community_space_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave spaces"
  ON public.community_space_members FOR DELETE
  USING (auth.uid() = user_id);

-- 10. Create user_follows table for following system
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follow relationships are viewable by participants"
  ON public.user_follows FOR SELECT
  USING (auth.uid() IN (follower_id, following_id));

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- 11. Create trending_topics table
CREATE TABLE IF NOT EXISTS public.trending_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE CHECK (char_length(tag) BETWEEN 1 AND 50),
  posts_count INTEGER NOT NULL DEFAULT 0 CHECK (posts_count >= 0),
  engagement_score INTEGER NOT NULL DEFAULT 0 CHECK (engagement_score >= 0),
  is_hot BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trending topics are viewable by everyone"
  ON public.trending_topics FOR SELECT
  USING (true);

-- 12. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'post_in_space')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id UUID, -- Can reference posts, comments, spaces, etc.
  target_type TEXT CHECK (target_type IN ('post', 'comment', 'space', 'user')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 200),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_intent_tag ON public.social_posts(intent_tag);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_fork_parent ON public.social_posts(fork_parent_id);
CREATE INDEX IF NOT EXISTS idx_social_stories_expires_at ON public.social_stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_community_spaces_intent ON public.community_spaces(intent_tag);
CREATE INDEX IF NOT EXISTS idx_trending_topics_score ON public.trending_topics(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- 14. Create triggers for automatic updates

-- Update community space member count
CREATE OR REPLACE FUNCTION public.update_space_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_spaces
    SET member_count = member_count + 1
    WHERE id = NEW.space_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_spaces
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.space_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_space_member_count ON public.community_space_members;
CREATE TRIGGER trg_space_member_count
AFTER INSERT OR DELETE ON public.community_space_members
FOR EACH ROW EXECUTE FUNCTION public.update_space_member_count();

-- Update poll option votes count
CREATE OR REPLACE FUNCTION public.update_poll_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_poll_options
    SET votes_count = votes_count + 1
    WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_poll_options
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_poll_votes_count ON public.social_poll_votes;
CREATE TRIGGER trg_poll_votes_count
AFTER INSERT OR DELETE ON public.social_poll_votes
FOR EACH ROW EXECUTE FUNCTION public.update_poll_votes_count();

-- Clean up expired stories
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.social_stories WHERE expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Schedule cleanup (this would need to be set up as a cron job in production)
-- For now, we'll create a function that can be called manually

-- Update community_spaces updated_at timestamp
CREATE TRIGGER update_community_spaces_updated_at
BEFORE UPDATE ON public.community_spaces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
