import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Route, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoutingRule {
  id: string;
  category: string;
  assignee_id: string;
  assignee_name: string;
}

interface ComplaintRoutingProps {
  complaintId: string;
  category: string;
  currentAssignee?: string;
  onAssigneeChange?: () => void;
}

export const ComplaintRouting = ({
  complaintId,
  category,
  currentAssignee,
  onAssigneeChange,
}: ComplaintRoutingProps) => {
  const [admins, setAdmins] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState(currentAssignee || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    setSelectedAdmin(currentAssignee || "");
  }, [currentAssignee]);

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles!user_roles_user_id_fkey (
          full_name
        )
      `)
      .eq("role", "admin");

    if (!error && data) {
      setAdmins(
        data.map((d: any) => ({
          id: d.user_id,
          full_name: d.profiles?.full_name || "Unknown Admin",
        }))
      );
    }
  };

  const handleAssign = async (adminId: string) => {
    setLoading(true);

    const { error } = await supabase
      .from("complaints")
      .update({ assigned_to: adminId || null })
      .eq("id", complaintId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign complaint",
        variant: "destructive",
      });
    } else {
      setSelectedAdmin(adminId);
      toast({
        title: "Assigned",
        description: adminId
          ? "Complaint assigned successfully"
          : "Complaint unassigned",
      });
      onAssigneeChange?.();
    }

    setLoading(false);
  };

  // Auto-routing suggestion based on category
  const getSuggestedAssignee = () => {
    const routingMap: Record<string, string> = {
      technical: "IT Staff",
      facilities: "Maintenance",
      curriculum: "Academic Coordinator",
      mentorship: "Mentor Coordinator",
    };
    return routingMap[category] || null;
  };

  const suggestion = getSuggestedAssignee();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Route className="h-4 w-4" />
          Complaint Routing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assign To
          </Label>
          <Select value={selectedAdmin} onValueChange={handleAssign} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {suggestion && !selectedAdmin && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary">
              <strong>Auto-routing suggestion:</strong> Based on the category "{category}",
              this should be assigned to {suggestion}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
