import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PhotoFile {
  file: File;
  preview: string;
}

interface MultiPhotoUploadProps {
  photos: PhotoFile[];
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  uploading: boolean;
}

export const MultiPhotoUpload = ({
  photos,
  onPhotoSelect,
  onRemovePhoto,
  uploading,
}: MultiPhotoUploadProps) => {
  return (
    <div className="space-y-2">
      <Label>Photos (Max 5)</Label>
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <img
              src={photo.preview}
              alt={`Preview ${index + 1}`}
              className="w-24 h-24 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemovePhoto(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {photos.length < 5 && (
          <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
            <Camera className="h-6 w-6 mb-1" />
            <span className="text-xs text-muted-foreground">Add Photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPhotoSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {photos.length}/5 photos selected
      </p>
    </div>
  );
};
