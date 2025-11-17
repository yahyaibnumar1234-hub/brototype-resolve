-- Add location field to complaints table
ALTER TABLE public.complaints 
ADD COLUMN location TEXT;

-- Add viewed_by_admin field to track if admin has seen the complaint
ALTER TABLE public.complaints 
ADD COLUMN viewed_by_admin BOOLEAN DEFAULT FALSE;

-- Update RLS policy for complaint deletion - students can only delete unviewed complaints
DROP POLICY IF EXISTS "Students can delete their own complaints" ON public.complaints;

CREATE POLICY "Students can delete unviewed complaints" 
ON public.complaints 
FOR DELETE 
USING (
  auth.uid() = student_id 
  AND viewed_by_admin = FALSE 
  AND status = 'open'::complaint_status
);

-- Admins can mark complaints as viewed
CREATE POLICY "Admins can delete complaints" 
ON public.complaints 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));