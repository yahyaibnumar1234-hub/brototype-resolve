import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Clock, Star, TrendingUp, Award } from "lucide-react";

interface StaffStats {
  admin_id: string;
  admin_name: string;
  total_assigned: number;
  total_resolved: number;
  avg_resolution_hours: number;
  avg_rating: number;
}

export const StaffPerformance = () => {
  const [stats, setStats] = useState<StaffStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Get all admins
    const { data: admins } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles!user_roles_user_id_fkey (
          full_name
        )
      `)
      .eq("role", "admin");

    if (!admins) {
      setLoading(false);
      return;
    }

    // Get complaints for each admin
    const statsPromises = admins.map(async (admin: any) => {
      const { data: complaints } = await supabase
        .from("complaints")
        .select("status, created_at, resolved_at")
        .eq("assigned_to", admin.user_id);

      const { data: feedback } = await supabase
        .from("complaint_feedback")
        .select("resolution_quality")
        .in(
          "complaint_id",
          (complaints || []).map((c: any) => c.id).filter(Boolean)
        );

      const resolved = complaints?.filter((c) => c.status === "resolved") || [];
      let totalHours = 0;

      resolved.forEach((c) => {
        if (c.created_at && c.resolved_at) {
          const hours =
            (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) /
            (1000 * 60 * 60);
          totalHours += hours;
        }
      });

      const avgRating =
        feedback && feedback.length > 0
          ? feedback.reduce((sum, f) => sum + (f.resolution_quality || 0), 0) /
            feedback.length
          : 0;

      return {
        admin_id: admin.user_id,
        admin_name: admin.profiles?.full_name || "Unknown",
        total_assigned: complaints?.length || 0,
        total_resolved: resolved.length,
        avg_resolution_hours: resolved.length > 0 ? totalHours / resolved.length : 0,
        avg_rating: avgRating,
      };
    });

    const results = await Promise.all(statsPromises);
    setStats(results.sort((a, b) => b.total_resolved - a.total_resolved));
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Staff Performance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stats.length === 0 ? (
            <p className="text-center text-muted-foreground">No staff data available</p>
          ) : (
            stats.map((staff, index) => (
              <div key={staff.admin_id} className="space-y-3 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {index === 0 && (
                      <Badge variant="default" className="bg-yellow-500">
                        Top Performer
                      </Badge>
                    )}
                    <h3 className="font-semibold">{staff.admin_name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">
                      {staff.avg_rating > 0 ? staff.avg_rating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Assigned</p>
                      <p className="font-semibold">{staff.total_assigned}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-muted-foreground">Resolved</p>
                      <p className="font-semibold text-green-600">{staff.total_resolved}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-muted-foreground">Avg Time</p>
                      <p className="font-semibold">
                        {staff.avg_resolution_hours > 0
                          ? `${staff.avg_resolution_hours.toFixed(1)}h`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Resolution Rate</span>
                    <span>
                      {staff.total_assigned > 0
                        ? Math.round((staff.total_resolved / staff.total_assigned) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      staff.total_assigned > 0
                        ? (staff.total_resolved / staff.total_assigned) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
