CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
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
