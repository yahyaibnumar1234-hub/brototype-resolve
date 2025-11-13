-- Create complaint_drafts table for auto-saving
CREATE TABLE IF NOT EXISTS public.complaint_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  category complaint_category,
  urgency complaint_urgency,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create complaint_tags junction table
CREATE TABLE IF NOT EXISTS public.complaint_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(complaint_id, tag_id)
);

-- Create private_notes table
CREATE TABLE IF NOT EXISTS public.private_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create complaint_feedback table
CREATE TABLE IF NOT EXISTS public.complaint_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resolution_speed INTEGER CHECK (resolution_speed >= 1 AND resolution_speed <= 5),
  resolution_quality INTEGER CHECK (resolution_quality >= 1 AND resolution_quality <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(complaint_id, student_id)
);

-- Add starred column to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.complaint_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaint_drafts
CREATE POLICY "Students can view their own drafts"
ON public.complaint_drafts FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own drafts"
ON public.complaint_drafts FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own drafts"
ON public.complaint_drafts FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own drafts"
ON public.complaint_drafts FOR DELETE
USING (auth.uid() = student_id);

-- RLS Policies for tags
CREATE POLICY "Everyone can view tags"
ON public.tags FOR SELECT
USING (true);

CREATE POLICY "Admins can create tags"
ON public.tags FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for complaint_tags
CREATE POLICY "Users can view tags on accessible complaints"
ON public.complaint_tags FOR SELECT
USING (EXISTS (
  SELECT 1 FROM complaints
  WHERE complaints.id = complaint_tags.complaint_id
  AND (complaints.student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Admins can manage complaint tags"
ON public.complaint_tags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for private_notes
CREATE POLICY "Students can view their own notes"
ON public.private_notes FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own notes"
ON public.private_notes FOR INSERT
WITH CHECK (auth.uid() = student_id AND EXISTS (
  SELECT 1 FROM complaints WHERE complaints.id = private_notes.complaint_id AND complaints.student_id = auth.uid()
));

CREATE POLICY "Students can update their own notes"
ON public.private_notes FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own notes"
ON public.private_notes FOR DELETE
USING (auth.uid() = student_id);

-- RLS Policies for complaint_feedback
CREATE POLICY "Students can view their own feedback"
ON public.complaint_feedback FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all feedback"
ON public.complaint_feedback FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can create feedback for their complaints"
ON public.complaint_feedback FOR INSERT
WITH CHECK (auth.uid() = student_id AND EXISTS (
  SELECT 1 FROM complaints WHERE complaints.id = complaint_feedback.complaint_id AND complaints.student_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaint_drafts_student_id ON public.complaint_drafts(student_id);
CREATE INDEX IF NOT EXISTS idx_complaint_tags_complaint_id ON public.complaint_tags(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_tags_tag_id ON public.complaint_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_private_notes_complaint_id ON public.private_notes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_feedback_complaint_id ON public.complaint_feedback(complaint_id);

-- Create trigger for updating complaint_drafts timestamp
CREATE OR REPLACE FUNCTION update_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_complaint_drafts_timestamp
BEFORE UPDATE ON public.complaint_drafts
FOR EACH ROW
EXECUTE FUNCTION update_draft_timestamp();

-- Create trigger for updating private_notes timestamp
CREATE TRIGGER update_private_notes_timestamp
BEFORE UPDATE ON public.private_notes
FOR EACH ROW
EXECUTE FUNCTION update_draft_timestamp();