-- Add crop_id column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL;