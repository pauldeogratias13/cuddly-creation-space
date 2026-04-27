CREATE TABLE public.commerce_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.commerce_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.commerce_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL CHECK (char_length(product_id) BETWEEN 1 AND 64),
  product_name TEXT NOT NULL CHECK (char_length(product_name) BETWEEN 1 AND 120),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.commerce_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON public.commerce_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own order items"
  ON public.commerce_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.commerce_orders o
      WHERE o.id = commerce_order_items.order_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own order items"
  ON public.commerce_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.commerce_orders o
      WHERE o.id = commerce_order_items.order_id
      AND o.user_id = auth.uid()
    )
  );
