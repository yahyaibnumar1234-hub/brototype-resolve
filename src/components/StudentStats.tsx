import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const StudentStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    avgResolutionTime: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const { data: complaints } = await supabase
      .from('complaints')
      .select('*')
      .eq('student_id', user.id);

    if (complaints) {
      const resolved = complaints.filter(c => c.status === 'resolved');
      const pending = complaints.filter(c => c.status !== 'resolved');
      
      // Calculate average resolution time in hours
      const resolutionTimes = resolved
        .filter(c => c.resolved_at && c.created_at)
        .map(c => {
          const created = new Date(c.created_at).getTime();
          const resolved = new Date(c.resolved_at!).getTime();
          return (resolved - created) / (1000 * 60 * 60); // Convert to hours
        });

      const avgTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

      setStats({
        total: complaints.length,
        resolved: resolved.length,
        pending: pending.length,
        avgResolutionTime: avgTime,
      });
    }
  };

  const resolutionRate = stats.total > 0 
    ? Math.round((stats.resolved / stats.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Total Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Resolved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            Pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Resolution Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{resolutionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg: {stats.avgResolutionTime.toFixed(1)}h
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
