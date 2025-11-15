-- Create table to track spam users
CREATE TABLE IF NOT EXISTS public.spam_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  marked_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.spam_users ENABLE ROW LEVEL SECURITY;

-- Only admins can manage spam users
CREATE POLICY "Admins can manage spam users"
ON public.spam_users
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));