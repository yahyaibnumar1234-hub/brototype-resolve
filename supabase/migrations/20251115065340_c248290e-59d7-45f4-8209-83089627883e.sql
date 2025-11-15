-- Create complaint templates table for one-tap quick complaints
CREATE TABLE public.complaint_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category complaint_category NOT NULL,
  urgency complaint_urgency NOT NULL DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.complaint_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active templates"
ON public.complaint_templates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage templates"
ON public.complaint_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add deadline and archive fields to complaints
ALTER TABLE public.complaints
ADD COLUMN deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN archived BOOLEAN DEFAULT false,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Create activity feed table for live updates
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity for their complaints"
ON public.activity_feed
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = activity_feed.complaint_id
    AND (complaints.student_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Authenticated users can create activity"
ON public.activity_feed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create custom statuses table
CREATE TABLE public.custom_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.custom_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active statuses"
ON public.custom_statuses
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage custom statuses"
ON public.custom_statuses
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add custom_status field to complaints (nullable for backwards compatibility)
ALTER TABLE public.complaints
ADD COLUMN custom_status_id UUID REFERENCES public.custom_statuses(id);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;

-- Function to auto-set deadline based on urgency
CREATE OR REPLACE FUNCTION public.set_complaint_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.deadline IS NULL THEN
    CASE NEW.urgency
      WHEN 'urgent' THEN
        NEW.deadline := NEW.created_at + INTERVAL '4 hours';
      WHEN 'high' THEN
        NEW.deadline := NEW.created_at + INTERVAL '24 hours';
      WHEN 'medium' THEN
        NEW.deadline := NEW.created_at + INTERVAL '48 hours';
      WHEN 'low' THEN
        NEW.deadline := NEW.created_at + INTERVAL '7 days';
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_deadline_on_insert
BEFORE INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.set_complaint_deadline();

-- Insert default complaint templates
INSERT INTO public.complaint_templates (title, description, category, urgency) VALUES
('Wi-Fi Not Working', 'The Wi-Fi connection is not working in my area. Unable to access the internet.', 'technical', 'high'),
('Laptop Issue', 'My laptop is experiencing technical problems and needs assistance.', 'technical', 'medium'),
('Hostel Maintenance', 'There is a maintenance issue in my hostel room that needs attention.', 'facilities', 'medium'),
('Mentor Not Available', 'My assigned mentor has not been available for scheduled sessions.', 'mentorship', 'low'),
('Classroom AC Not Working', 'The air conditioning in the classroom is not functioning properly.', 'facilities', 'medium');

-- Insert default custom statuses
INSERT INTO public.custom_statuses (name, color, description) VALUES
('Waiting for Vendor', '#F59E0B', 'Waiting for external vendor response'),
('Parts Ordered', '#3B82F6', 'Required parts have been ordered'),
('Escalated', '#EF4444', 'Issue has been escalated to senior management'),
('Under Review', '#8B5CF6', 'Currently under review by the team');
