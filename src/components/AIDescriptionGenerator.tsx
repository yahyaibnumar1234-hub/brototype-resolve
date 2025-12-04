import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIDescriptionGeneratorProps {
  title: string;
  category?: string;
  onDescriptionGenerated: (description: string) => void;
  disabled?: boolean;
}

export const AIDescriptionGenerator = ({
  title,
  category,
  onDescriptionGenerated,
  disabled = false,
}: AIDescriptionGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDescription = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title first to generate a description",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "generate-description",
          complaint: title,
          category: category || "",
        },
      });

      if (error) {
        throw error;
      }

      if (data?.result) {
        onDescriptionGenerated(data.result);
        toast({
          title: "Description Generated",
          description: "AI has generated a description based on your title",
        });
      }
    } catch (error: any) {
      console.error("Error generating description:", error);
      
      if (error?.message?.includes("429") || error?.status === 429) {
        toast({
          title: "Rate Limited",
          description: "Too many requests. Please try again later.",
          variant: "destructive",
        });
      } else if (error?.message?.includes("402") || error?.status === 402) {
        toast({
          title: "Credits Exhausted",
          description: "AI credits exhausted. Please add credits to continue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate description. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generateDescription}
      disabled={disabled || isGenerating || !title.trim()}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {isGenerating ? "Generating..." : "Generate Description with AI"}
    </Button>
  );
};
