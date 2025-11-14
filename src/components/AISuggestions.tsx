import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AISuggestionsProps {
  complaint: {
    title: string;
    description: string;
    category: string;
  };
}

export const AISuggestions = ({ complaint }: AISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          type: 'suggestions',
          complaint 
        }
      });

      if (error) throw error;

      if (data?.result) {
        setSuggestions(data.result);
      }
    } catch (error: any) {
      console.error("AI suggestions error:", error);
      toast({
        title: "AI Error",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!suggestions ? (
          <Button 
            onClick={generateSuggestions} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              "Generate AI Suggestions"
            )}
          </Button>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{suggestions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
