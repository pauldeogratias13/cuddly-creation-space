CREATE TABLE public.chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages
ADD COLUMN thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE;

CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (char_length(type) BETWEEN 1 AND 48),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body TEXT CHECK (char_length(body) <= 500),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat threads"
  ON public.chat_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat threads"
  ON public.chat_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat threads"
  ON public.chat_threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create own chat messages" ON public.chat_messages;

CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() = user_id
    AND (
      thread_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id AND t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      thread_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id AND t.user_id = auth.uid()
      )
    )
  );
