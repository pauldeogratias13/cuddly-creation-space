CREATE POLICY "Users can update own orders"
  ON public.commerce_orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
  ON public.chat_messages FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (
      thread_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id AND t.user_id = auth.uid()
      )
    )
  )
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
