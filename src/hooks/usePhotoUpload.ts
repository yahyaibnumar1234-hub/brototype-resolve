import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export const usePhotoUpload = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (complaintId: string, userId: string): Promise<string | null> => {
    if (!photo) return null;

    setUploading(true);
    try {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${complaintId}-${Date.now()}.${fileExt}`;
      const filePath = `complaints/${userId}/${fileName}`;

      // Upload to Supabase Storage (we'll create the bucket in migration)
      const { error: uploadError } = await supabase.storage
        .from("complaint-photos")
        .upload(filePath, photo);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("complaint-photos")
        .getPublicUrl(filePath);

      // Save attachment record
      const { error: attachmentError } = await supabase
        .from("attachments")
        .insert({
          complaint_id: complaintId,
          uploaded_by: userId,
          file_name: photo.name,
          file_url: publicUrl,
          file_type: photo.type,
        });

      if (attachmentError) throw attachmentError;

      return publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  return {
    photo,
    photoPreview,
    uploading,
    handlePhotoSelect,
    uploadPhoto,
    removePhoto,
  };
};
