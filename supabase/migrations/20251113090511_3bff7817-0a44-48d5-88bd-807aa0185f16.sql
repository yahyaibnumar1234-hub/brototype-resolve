-- Create storage bucket for complaint photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-photos', 'complaint-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage
CREATE POLICY "Users can upload their own complaint photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-photos' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view complaint photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-photos');

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'complaint-photos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);