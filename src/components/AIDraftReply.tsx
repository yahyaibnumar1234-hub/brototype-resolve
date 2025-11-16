import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AIDraftReplyProps {
  complaint: {
    title: string;
    description: string;
    category: string;
    status: string;
  };
  onReplyGenerated: (reply: string) => void;
}

export const AIDraftReply = ({ complaint, onReplyGenerated }: AIDraftReplyProps) => {
  const [generating, setGenerating] = useState(false);

  const generateReply = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('draft-reply', {
        body: { complaint }
      });

      if (error) throw error;

      if (data?.reply) {
        onReplyGenerated(data.reply);
        toast({
          title: "Reply Generated",
          description: "AI has drafted a professional response",
        });
      }
    } catch (error: any) {
      console.error("AI reply generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate reply",
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
      onClick={generateReply}
      disabled={generating}
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
          AI Draft Reply
        </>
      )}
    </Button>
  );
};
