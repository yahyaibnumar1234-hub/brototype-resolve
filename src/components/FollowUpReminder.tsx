import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface PendingFollowUp {
  id: string;
  title: string;
  created_at: string;
  status: string;
}

export const FollowUpReminder = () => {
  const [pendingFollowUps, setPendingFollowUps] = useState<PendingFollowUp[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkFollowUps();
    }
  }, [user]);

  const checkFollowUps = async () => {
    // Get complaints older than 3 days that are not resolved
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data, error } = await supabase
      .from("complaints")
      .select("id, title, created_at, status")
      .eq("student_id", user?.id)
      .neq("status", "resolved")
      .lt("created_at", threeDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPendingFollowUps(data);
    }
  };

  const handleFollowUp = (complaintId: string) => {
    navigate(`/complaint/${complaintId}`);
  };

  const dismissFollowUp = async (complaintId: string) => {
    // Store dismissed follow-ups in localStorage
    const dismissed = JSON.parse(localStorage.getItem("dismissedFollowUps") || "[]");
    dismissed.push({ id: complaintId, dismissedAt: new Date().toISOString() });
    localStorage.setItem("dismissedFollowUps", JSON.stringify(dismissed));
    
    setPendingFollowUps((prev) => prev.filter((c) => c.id !== complaintId));
    
    toast({
      title: "Follow-up Dismissed",
      description: "You can still view this complaint from your dashboard",
    });
  };

  // Filter out dismissed follow-ups
  const dismissed = JSON.parse(localStorage.getItem("dismissedFollowUps") || "[]");
  const dismissedIds = new Set(dismissed.map((d: any) => d.id));
  const activeFollowUps = pendingFollowUps.filter((c) => !dismissedIds.has(c.id));

  if (activeFollowUps.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-5 w-5 text-yellow-500" />
          Follow-Up Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          These complaints have been pending for more than 3 days. Would you like to follow up?
        </p>
        {activeFollowUps.slice(0, 3).map((complaint) => (
          <div
            key={complaint.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{complaint.title}</h4>
              <p className="text-xs text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissFollowUp(complaint.id)}
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => handleFollowUp(complaint.id)}
                className="gap-1"
              >
                Follow Up
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {activeFollowUps.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{activeFollowUps.length - 3} more pending follow-ups
          </p>
        )}
      </CardContent>
    </Card>
  );
};
