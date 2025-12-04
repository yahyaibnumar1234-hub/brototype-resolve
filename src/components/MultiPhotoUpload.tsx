import { useRef } from "react";
import { Camera, X, ImagePlus, Video } from "lucide-react";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    galleryInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <Label>Photos (Max 5)</Label>
      
      {/* Photo previews */}
      {photos.length > 0 && (
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
        </div>
      )}

      {/* Upload buttons */}
      {photos.length < 5 && (
        <div className="flex gap-2">
          {/* Camera capture - uses capture attribute */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCameraCapture}
            disabled={uploading}
            className="flex-1 gap-2"
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoSelect}
            disabled={uploading}
            className="hidden"
          />

          {/* Gallery selection */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGallerySelect}
            disabled={uploading}
            className="flex-1 gap-2"
          >
            <ImagePlus className="h-4 w-4" />
            From Gallery
          </Button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPhotoSelect}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {photos.length}/5 photos selected
      </p>
    </div>
  );
};
