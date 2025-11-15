import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, FileText, CheckCircle, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_feed',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_feed')
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setActivities(data as any);
    }
    setLoading(false);
  };

  const getIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'status_changed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'commented':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'assigned':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">{getIcon(activity.action_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.profiles?.full_name || 'User'} •{' '}
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
