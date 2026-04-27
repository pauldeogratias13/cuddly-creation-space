ALTER TABLE public.chat_threads
ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
