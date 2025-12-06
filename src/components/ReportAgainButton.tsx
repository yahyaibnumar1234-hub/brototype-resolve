import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ReportAgainButtonProps {
  originalComplaint: {
    id: string;
    title: string;
    description: string;
    category: string;
  };
}

export const ReportAgainButton = ({ originalComplaint }: ReportAgainButtonProps) => {
  const [open, setOpen] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleReportAgain = async () => {
    setIsSubmitting(true);

    const newTitle = `[Follow-up] ${originalComplaint.title}`;
    const newDescription = `This is a follow-up to complaint ID: ${originalComplaint.id.slice(0, 8)}\n\nOriginal Issue:\n${originalComplaint.description}\n\nReason for reopening:\n${additionalInfo || "Issue was not fully resolved."}`;

    const { data, error } = await supabase
      .from("complaints")
      .insert([{
        student_id: user?.id,
        title: newTitle.slice(0, 100),
        description: newDescription,
        category: originalComplaint.category as any,
        urgency: "high" as any,
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit follow-up complaint",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Follow-up Submitted",
        description: "Your follow-up complaint has been created",
      });
      setOpen(false);
      if (data) {
        navigate(`/complaint/${data.id}`);
      }
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          Report Again
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Issue Again</DialogTitle>
          <DialogDescription>
            Submit a follow-up if the issue wasn't properly resolved
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <span className="font-medium">Original:</span> {originalComplaint.title}
          </div>
          
          <Textarea
            placeholder="Why are you reporting this again? What wasn't fixed?"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={4}
          />
          
          <Button
            className="w-full gap-2"
            onClick={handleReportAgain}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            Submit Follow-up Complaint
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
