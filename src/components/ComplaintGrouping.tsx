import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { FolderPlus, Link2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ComplaintGroupingProps {
  currentComplaintId: string;
  currentTitle: string;
}

interface RelatedComplaint {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export const ComplaintGrouping = ({ currentComplaintId, currentTitle }: ComplaintGroupingProps) => {
  const [open, setOpen] = useState(false);
  const [complaints, setComplaints] = useState<RelatedComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMyComplaints();
    }
  }, [open]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("complaints")
      .select("id, title, status, created_at")
      .eq("student_id", user?.id)
      .neq("id", currentComplaintId)
      .order("created_at", { ascending: false })
      .limit(10);

    setComplaints(data || []);
    setLoading(false);
  };

  const handleLinkComplaint = async (relatedId: string) => {
    setLinking(true);
    
    const { error } = await supabase
      .from("complaint_relations")
      .insert([{
        complaint_id: currentComplaintId,
        related_complaint_id: relatedId,
        similarity_score: 100, // Manual link = 100% related
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to link complaints",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Complaints Linked",
        description: "These complaints are now grouped together",
      });
      setOpen(false);
    }
    
    setLinking(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FolderPlus className="h-4 w-4" />
          Group with Related
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Related Complaints</DialogTitle>
          <DialogDescription>
            Group this complaint with other related issues you've submitted
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted rounded">
          <strong>Current:</strong> {currentTitle}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : complaints.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No other complaints to link with
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{complaint.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLinkComplaint(complaint.id)}
                    disabled={linking}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
