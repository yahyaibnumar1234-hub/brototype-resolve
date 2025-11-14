import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ComplaintSummaryProps {
  complaint: {
    title: string;
    description: string;
    category: string;
    urgency: string;
  };
}

export const ComplaintSummary = ({ complaint }: ComplaintSummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          type: 'summary',
          complaint 
        }
      });

      if (error) throw error;

      if (data?.result) {
        setSummary(data.result);
      }
    } catch (error: any) {
      console.error("AI summary error:", error);
      toast({
        title: "AI Error",
        description: error.message || "Failed to generate summary",
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
          <FileText className="h-5 w-5" />
          Quick Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!summary ? (
          <Button 
            onClick={generateSummary} 
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
              "Generate AI Summary"
            )}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
};
