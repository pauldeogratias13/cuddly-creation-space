CREATE TABLE public.commerce_cart_items (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL CHECK (char_length(product_id) BETWEEN 1 AND 64),
  product_name TEXT NOT NULL CHECK (char_length(product_name) BETWEEN 1 AND 120),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE public.commerce_cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own cart lines"
  ON public.commerce_cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own cart lines"
  ON public.commerce_cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own cart lines"
  ON public.commerce_cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own cart lines"
  ON public.commerce_cart_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.user_notifications FOR DELETE
  USING (auth.uid() = user_id);
