-- ── Content Creator Features: Follow system + User content ─────────
--
-- This migration adds:
--   1. user_follows table for follow/unfollow functionality
--   2. user_id column to public_videos for user-generated content
--   3. Extends profiles table with username, full_name, avatar_url, bio columns
--   4. Seed data for 5 content creators

-- ── 0. Ensure profiles table has required columns ────────────────────────────

-- First, create profiles table if it doesn't exist (without assuming columns)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY
);

-- Add columns to profiles if they don't exist
DO $$
BEGIN
  -- Add username column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
  END IF;

  -- Add full_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Add avatar_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add bio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT DEFAULT '';
  END IF;

  -- Add created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add foreign key to auth.users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND constraint_name = 'profiles_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- ── 1. User Follows Table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Ensure users can't follow themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'check_not_self_follow'
  ) THEN
    ALTER TABLE public.user_follows 
    ADD CONSTRAINT check_not_self_follow 
    CHECK (follower_id != following_id);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created ON public.user_follows(created_at);

-- ── 2. Add user_id to public_videos ─────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'public_videos' 
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.public_videos 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_public_videos_user_id 
  ON public.public_videos(user_id) 
  WHERE user_id IS NOT NULL;

-- ── 3. Row Level Security Policies ──────────────────────────────────────────

-- user_follows policies
DO $$
BEGIN
  -- Enable RLS on user_follows
  ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

  -- Anyone can read follows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_follows'
      AND policyname = 'Anyone can view follows'
  ) THEN
    CREATE POLICY "Anyone can view follows"
      ON public.user_follows FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- Authenticated users can create follows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_follows'
      AND policyname = 'Users can follow others'
  ) THEN
    CREATE POLICY "Users can follow others"
      ON public.user_follows FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = follower_id);
  END IF;

  -- Users can delete their own follows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_follows'
      AND policyname = 'Users can unfollow'
  ) THEN
    CREATE POLICY "Users can unfollow"
      ON public.user_follows FOR DELETE
      TO authenticated
      USING (auth.uid() = follower_id);
  END IF;
END $$;

-- Policies for profiles
DO $$
BEGIN
  -- Enable RLS on profiles
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  -- Anyone can read profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Anyone can view profiles'
  ) THEN
    CREATE POLICY "Anyone can view profiles"
      ON public.profiles FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- Users can update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Users can insert their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can create profile'
  ) THEN
    CREATE POLICY "Users can create profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ── 4. Function to get creator stats ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_creator_stats(creator_id UUID)
RETURNS TABLE (
  followers_count BIGINT,
  following_count BIGINT,
  posts_count BIGINT,
  total_likes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.user_follows WHERE following_id = creator_id) AS followers_count,
    (SELECT COUNT(*) FROM public.user_follows WHERE follower_id = creator_id) AS following_count,
    (SELECT COUNT(*) FROM public.public_videos WHERE user_id = creator_id AND is_active = true) AS posts_count,
    (SELECT COALESCE(SUM(likes_count), 0) 
     FROM public.social_posts sp
     JOIN public.public_videos pv ON sp.text = CONCAT('video:', pv.source_url)
     WHERE pv.user_id = creator_id) AS total_likes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Auto-create profile on signup ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', 
             CONCAT('https://api.dicebear.com/7.x/identicon/svg?seed=', NEW.email))
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. Seed Data for 5 Content Creators ─────────────────────────────────────
-- Create demo auth users for the 5 creators (these are test accounts)

DO $$
BEGIN
  -- Only insert if these users don't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nexus_official@demo.com') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'nexus_official@demo.com',
      '{"username": "nexus_official", "full_name": "NEXUS Official"}',
      NOW(),
      NOW()
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tech_reviewer@demo.com') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      'tech_reviewer@demo.com',
      '{"username": "tech_reviewer", "full_name": "Tech Reviewer"}',
      NOW(),
      NOW()
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nature_films@demo.com') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000003',
      'nature_films@demo.com',
      '{"username": "nature_films", "full_name": "Nature Films"}',
      NOW(),
      NOW()
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cooking_master@demo.com') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000004',
      'cooking_master@demo.com',
      '{"username": "cooking_master", "full_name": "Cooking Master"}',
      NOW(),
      NOW()
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'music_live@demo.com') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000005',
      'music_live@demo.com',
      '{"username": "music_live", "full_name": "Music Live"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Now insert/update profiles for these demo users
-- Using ON CONFLICT on id to handle existing profiles
INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, created_at) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'nexus_official',
  'NEXUS Official',
  'https://api.dicebear.com/7.x/identicon/svg?seed=nexus',
  'Official NEXUS account - The World''s First True Super-App',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, created_at) 
SELECT 
  '00000000-0000-0000-0000-000000000002',
  'tech_reviewer',
  'Tech Reviewer',
  'https://api.dicebear.com/7.x/identicon/svg?seed=tech',
  'Reviewing the latest in technology and innovation',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, created_at) 
SELECT 
  '00000000-0000-0000-0000-000000000003',
  'nature_films',
  'Nature Films',
  'https://api.dicebear.com/7.x/identicon/svg?seed=nature',
  'Capturing the beauty of our natural world',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, created_at) 
SELECT 
  '00000000-0000-0000-0000-000000000004',
  'cooking_master',
  'Cooking Master',
  'https://api.dicebear.com/7.x/identicon/svg?seed=cooking',
  'Delicious recipes and cooking tutorials',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, created_at) 
SELECT 
  '00000000-0000-0000-0000-000000000005',
  'music_live',
  'Music Live',
  'https://api.dicebear.com/7.x/identicon/svg?seed=music',
  'Live music performances and covers',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;