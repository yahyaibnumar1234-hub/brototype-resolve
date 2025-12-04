import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Wand2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIComplaintHelperProps {
  onComplaintGenerated: (data: {
    title: string;
    description: string;
    category: string;
    urgency: string;
    mood?: string;
  }) => void;
}

export const AIComplaintHelper = ({ onComplaintGenerated }: AIComplaintHelperProps) => {
  const [roughText, setRoughText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{
    title: string;
    description: string;
    category: string;
    urgency: string;
    mood: string;
  } | null>(null);
  const { toast } = useToast();

  const processWithAI = async () => {
    if (!roughText.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter some text about your complaint",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "format-complaint",
          complaint: roughText,
        },
      });

      if (error) throw error;

      if (data?.result) {
        try {
          const parsed = JSON.parse(data.result);
          setPreview(parsed);
          toast({
            title: "Complaint Formatted",
            description: "AI has cleaned and categorized your complaint",
          });
        } catch {
          // If not JSON, use as description
          setPreview({
            title: roughText.slice(0, 50) + (roughText.length > 50 ? "..." : ""),
            description: data.result,
            category: "other",
            urgency: "medium",
            mood: "neutral",
          });
        }
      }
    } catch (error) {
      console.error("AI processing error:", error);
      toast({
        title: "Error",
        description: "Failed to process complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyFormatted = () => {
    if (preview) {
      onComplaintGenerated(preview);
      setRoughText("");
      setPreview(null);
      toast({
        title: "Applied",
        description: "Formatted complaint applied to form",
      });
    }
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          AI Complaint Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Type or speak your complaint in any format. AI will clean, format, and categorize it.
          </p>
          <Textarea
            placeholder="Example: wifi not working in lab since morning very urgent pls fix asap cant do work..."
            value={roughText}
            onChange={(e) => setRoughText(e.target.value)}
            rows={4}
            className="glass-input"
          />
        </div>

        <Button
          onClick={processWithAI}
          disabled={isProcessing || !roughText.trim()}
          className="w-full gap-2"
          variant="neon"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Format with AI
            </>
          )}
        </Button>

        {preview && (
          <Card className="bg-primary/5 border-primary/30 animate-fade-in">
            <CardContent className="pt-4 space-y-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Title</span>
                <p className="font-semibold">{preview.title}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Description</span>
                <p className="text-sm whitespace-pre-wrap">{preview.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary capitalize">
                  {preview.category}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-600 capitalize">
                  {preview.urgency}
                </span>
                {preview.mood && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-600 capitalize">
                    {preview.mood}
                  </span>
                )}
              </div>
              <Button onClick={applyFormatted} className="w-full gap-2">
                Use This Format
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
