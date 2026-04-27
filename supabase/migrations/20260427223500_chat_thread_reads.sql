CREATE TABLE public.chat_thread_reads (
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

ALTER TABLE public.chat_thread_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own thread read markers"
  ON public.chat_thread_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own thread read markers"
  ON public.chat_thread_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thread read markers"
  ON public.chat_thread_reads FOR UPDATE
  USING (auth.uid() = user_id);
