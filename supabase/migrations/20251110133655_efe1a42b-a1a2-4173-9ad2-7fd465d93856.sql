-- Create enum types for roles, complaint status, and urgency
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE public.complaint_urgency AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.complaint_category AS ENUM ('technical', 'facilities', 'curriculum', 'mentorship', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.complaint_category NOT NULL,
  urgency public.complaint_urgency NOT NULL DEFAULT 'medium',
  status public.complaint_status NOT NULL DEFAULT 'open',
  is_anonymous BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Students can view their own complaints
CREATE POLICY "Students can view their own complaints"
  ON public.complaints FOR SELECT
  USING (auth.uid() = student_id);

-- Admins can view all complaints
CREATE POLICY "Admins can view all complaints"
  ON public.complaints FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Students can create complaints
CREATE POLICY "Students can create complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own complaints if status is 'open'
CREATE POLICY "Students can update open complaints"
  ON public.complaints FOR UPDATE
  USING (auth.uid() = student_id AND status = 'open');

-- Admins can update any complaint
CREATE POLICY "Admins can update complaints"
  ON public.complaints FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on complaints they have access to
CREATE POLICY "Users can view comments on accessible complaints"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints
      WHERE id = complaint_id
      AND (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Users can create comments on complaints they have access to
CREATE POLICY "Users can create comments on accessible complaints"
  ON public.comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints
      WHERE id = complaint_id
      AND (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Create attachments table
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments on complaints they have access to
CREATE POLICY "Users can view attachments on accessible complaints"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints
      WHERE id = complaint_id
      AND (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Users can create attachments on complaints they have access to
CREATE POLICY "Users can create attachments on accessible complaints"
  ON public.attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints
      WHERE id = complaint_id
      AND (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  -- Assign student role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile and role on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update complaints updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_complaint_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to update complaint timestamps
CREATE TRIGGER update_complaints_timestamp
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_complaint_timestamp();