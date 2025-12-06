import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhotoProblemDetectorProps {
  onProblemDetected: (data: {
    problemType: string;
    description: string;
    category: string;
    confidence: number;
  }) => void;
}

export const PhotoProblemDetector = ({ onProblemDetected }: PhotoProblemDetectorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsProcessing(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke("ai-assistant", {
          body: {
            type: "detect-photo-problem",
            imageBase64: base64.split(",")[1],
          },
        });

        if (error) {
          if (error.message?.includes("429")) {
            toast({
              title: "Rate Limit",
              description: "Too many requests. Please wait a moment.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else if (data?.result) {
          try {
            const parsed = JSON.parse(data.result);
            onProblemDetected(parsed);
            toast({
              title: "Problem Detected",
              description: `Detected: ${parsed.problemType}`,
            });
          } catch {
            // Fallback if not JSON
            onProblemDetected({
              problemType: "Unknown Issue",
              description: data.result,
              category: "other",
              confidence: 50,
            });
          }
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Photo detection error:", error);
      toast({
        title: "Error",
        description: "Failed to analyze photo. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-4 w-4 text-primary" />
          AI Photo Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Take a photo and AI will detect the problem type automatically
        </p>
        
        <label className="block">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
            disabled={isProcessing}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={isProcessing}
            onClick={(e) => {
              e.preventDefault();
              (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Capture & Detect
              </>
            )}
          </Button>
        </label>

        {previewUrl && (
          <div className="relative rounded-lg overflow-hidden border">
            <img
              src={previewUrl}
              alt="Captured photo"
              className="w-full h-32 object-cover"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Analyzing image...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
