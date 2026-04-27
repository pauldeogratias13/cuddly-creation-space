DROP POLICY "Anyone can join the waitlist" ON public.waitlist;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND char_length(email) <= 254
    AND (handle IS NULL OR char_length(handle) BETWEEN 2 AND 32)
    AND (source IS NULL OR char_length(source) <= 64)
  );
