import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
}

interface AIResponseSuggestionsProps {
  complaint: Complaint;
  onSelectSuggestion: (suggestion: string) => void;
}

export const AIResponseSuggestions = ({ complaint, onSelectSuggestion }: AIResponseSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'response-suggestions',
          complaint: {
            title: complaint.title,
            description: complaint.description,
            category: complaint.category,
            urgency: complaint.urgency,
          }
        }
      });

      if (error) throw error;

      // Parse the AI response to extract suggestions
      const result = data.result;
      const suggestionList = result
        .split(/\d+\.\s+/)
        .filter((s: string) => s.trim())
        .slice(0, 3);

      setSuggestions(suggestionList);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaint) {
      generateSuggestions();
    }
  }, [complaint.id]);

  const handleCopy = (suggestion: string, index: number) => {
    navigator.clipboard.writeText(suggestion);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Response Suggestions
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateSuggestions}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Generating suggestions...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No suggestions available
          </p>
        ) : (
          suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className="group relative p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <p className="text-sm pr-16">{suggestion.trim()}</p>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleCopy(suggestion.trim(), index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onSelectSuggestion(suggestion.trim())}
                >
                  Use
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
