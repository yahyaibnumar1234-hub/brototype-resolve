import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AITitleGeneratorProps {
  description: string;
  onTitleGenerated: (title: string) => void;
  disabled?: boolean;
}

export const AITitleGenerator = ({ description, onTitleGenerated, disabled }: AITitleGeneratorProps) => {
  const [generating, setGenerating] = useState(false);

  const generateTitle = async () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please write a description first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-title', {
        body: { description }
      });

      if (error) throw error;

      if (data?.title) {
        onTitleGenerated(data.title);
        toast({
          title: "Title Generated",
          description: "AI has created a title for your complaint",
        });
      }
    } catch (error: any) {
      console.error("AI title generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate title",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generateTitle}
      disabled={disabled || generating || !description.trim()}
      className="w-full"
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Title with AI
        </>
      )}
    </Button>
  );
};
