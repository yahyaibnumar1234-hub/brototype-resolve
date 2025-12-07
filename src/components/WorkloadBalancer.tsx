import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Scale, Zap, User, Loader2, RefreshCw, CheckCircle } from "lucide-react";

interface Admin {
  id: string;
  full_name: string;
  email: string;
  assignedCount: number;
  openCount: number;
}

interface Complaint {
  id: string;
  title: string;
  category: string;
  urgency: string;
  assigned_to: string | null;
}

interface WorkloadBalancerProps {
  complaints: Complaint[];
  onAssignmentComplete?: () => void;
}

export const WorkloadBalancer = ({ complaints, onAssignmentComplete }: WorkloadBalancerProps) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [balancing, setBalancing] = useState(false);
  const { toast } = useToast();

  const unassignedComplaints = complaints.filter(c => !c.assigned_to && c.urgency !== 'low');

  useEffect(() => {
    fetchAdmins();
  }, [complaints]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Get all admin users
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (!adminRoles) return;

      const adminIds = adminRoles.map(r => r.user_id);

      // Get admin profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", adminIds);

      if (!profiles) return;

      // Calculate workload for each admin
      const adminsWithWorkload = profiles.map(profile => {
        const assignedComplaints = complaints.filter(c => c.assigned_to === profile.id);
        const openComplaints = assignedComplaints.filter(
          c => c.urgency !== 'low' && c.urgency !== 'medium'
        );

        return {
          ...profile,
          assignedCount: assignedComplaints.length,
          openCount: openComplaints.length,
        };
      });

      setAdmins(adminsWithWorkload.sort((a, b) => a.assignedCount - b.assignedCount));
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const autoBalanceWorkload = async () => {
    if (unassignedComplaints.length === 0) {
      toast({
        title: "Nothing to Assign",
        description: "All complaints are already assigned",
      });
      return;
    }

    if (admins.length === 0) {
      toast({
        title: "No Admins Available",
        description: "No admin users found to assign complaints",
        variant: "destructive",
      });
      return;
    }

    setBalancing(true);
    try {
      // Sort admins by current workload (least first)
      const sortedAdmins = [...admins].sort((a, b) => a.assignedCount - b.assignedCount);
      
      // Distribute unassigned complaints
      const assignments: { id: string; assigned_to: string }[] = [];
      
      unassignedComplaints.forEach((complaint, index) => {
        // Assign to admin with least workload using round-robin
        const adminIndex = index % sortedAdmins.length;
        assignments.push({
          id: complaint.id,
          assigned_to: sortedAdmins[adminIndex].id,
        });
      });

      // Update all complaints
      for (const assignment of assignments) {
        await supabase
          .from("complaints")
          .update({ assigned_to: assignment.assigned_to })
          .eq("id", assignment.id);
      }

      toast({
        title: "Workload Balanced",
        description: `${assignments.length} complaints assigned to ${sortedAdmins.length} admins`,
      });

      fetchAdmins();
      onAssignmentComplete?.();
    } catch (error) {
      console.error("Error balancing workload:", error);
      toast({
        title: "Error",
        description: "Failed to balance workload",
        variant: "destructive",
      });
    } finally {
      setBalancing(false);
    }
  };

  const maxWorkload = Math.max(...admins.map(a => a.assignedCount), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              AI Workload Balancer
            </CardTitle>
            <CardDescription>
              Auto-assign complaints based on admin workload
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdmins}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unassigned count */}
        {unassignedComplaints.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{unassignedComplaints.length} unassigned complaints</span>
            </div>
            <Button 
              size="sm" 
              onClick={autoBalanceWorkload}
              disabled={balancing}
            >
              {balancing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Balancing...
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4 mr-2" />
                  Auto-Balance
                </>
              )}
            </Button>
          </div>
        )}

        {unassignedComplaints.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">All complaints are assigned</span>
          </div>
        )}

        {/* Admin workload list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No admins found
            </p>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{admin.full_name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {admin.assignedCount} assigned
                  </Badge>
                </div>
                <Progress 
                  value={(admin.assignedCount / maxWorkload) * 100} 
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
