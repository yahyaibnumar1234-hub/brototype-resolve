import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PhotoFile {
  file: File;
  preview: string;
}

export const useMultiPhotoUpload = () => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate each file
    const validFiles: PhotoFile[] = [];
    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    // Limit to 5 photos total
    const newPhotos = [...photos, ...validFiles].slice(0, 5);
    setPhotos(newPhotos);

    if (newPhotos.length === 5 && validFiles.length > 0) {
      toast({
        title: "Photo Limit Reached",
        description: "Maximum 5 photos allowed",
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const uploadPhotos = async (complaintId: string, userId: string) => {
    if (photos.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of photos) {
        const fileExt = photo.file.name.split(".").pop();
        const fileName = `${userId}/${complaintId}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("complaint-photos")
          .upload(fileName, photo.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("complaint-photos")
          .getPublicUrl(fileName);

        const photoUrl = urlData.publicUrl;

        const { error: attachmentError } = await supabase
          .from("attachments")
          .insert({
            complaint_id: complaintId,
            file_name: photo.file.name,
            file_url: photoUrl,
            file_type: photo.file.type,
            uploaded_by: userId,
          });

        if (attachmentError) throw attachmentError;

        uploadedUrls.push(photoUrl);
      }

      return uploadedUrls;
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photos",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const clearPhotos = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
  };

  return {
    photos,
    uploading,
    handlePhotoSelect,
    removePhoto,
    uploadPhotos,
    clearPhotos,
  };
};
