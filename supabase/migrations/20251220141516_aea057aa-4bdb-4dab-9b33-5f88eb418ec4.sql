-- Create inventory table for tracking seeds, fertilizers, and chemicals
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('seeds', 'fertilizers', 'chemicals', 'other')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  minimum_stock NUMERIC NOT NULL DEFAULT 10,
  purchase_price NUMERIC,
  purchase_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own inventory" 
ON public.inventory FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" 
ON public.inventory FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" 
ON public.inventory FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory" 
ON public.inventory FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();