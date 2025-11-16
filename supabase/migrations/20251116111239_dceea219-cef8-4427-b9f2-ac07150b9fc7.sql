-- Add mood, severity slider, and importance badge to complaints
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS mood TEXT CHECK (mood IN ('angry', 'frustrated', 'sad', 'neutral')),
ADD COLUMN IF NOT EXISTS severity_score INTEGER CHECK (severity_score BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS importance_type TEXT CHECK (importance_type IN ('personal', 'group', 'campus-wide')),
ADD COLUMN IF NOT EXISTS is_spam_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spam_confidence NUMERIC(3,2);

-- Add index for spam detection
CREATE INDEX IF NOT EXISTS idx_complaints_spam ON public.complaints(is_spam_flagged) WHERE is_spam_flagged = TRUE;

-- Add auto-generated title tracking
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS is_auto_title BOOLEAN DEFAULT FALSE;

-- Create table for related complaints tracking
CREATE TABLE IF NOT EXISTS public.complaint_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  related_complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  similarity_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(complaint_id, related_complaint_id)
);

-- Enable RLS
ALTER TABLE public.complaint_relations ENABLE ROW LEVEL SECURITY;

-- RLS policies for complaint_relations
CREATE POLICY "Users can view relations for accessible complaints"
ON public.complaint_relations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM complaints 
    WHERE complaints.id = complaint_relations.complaint_id 
    AND (complaints.student_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "System can insert relations"
ON public.complaint_relations
FOR INSERT
WITH CHECK (TRUE);