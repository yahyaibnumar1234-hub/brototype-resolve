import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInHours, differenceInDays } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  created_at: string;
  status: string;
  urgency: string;
}

interface ComplaintAgeingHeatmapProps {
  complaints: Complaint[];
  onSelectComplaint?: (id: string) => void;
}

export const ComplaintAgeingHeatmap = ({ complaints, onSelectComplaint }: ComplaintAgeingHeatmapProps) => {
  const ageingData = useMemo(() => {
    const now = new Date();
    
    // Filter only open/in-progress complaints
    const pendingComplaints = complaints.filter(
      c => c.status === "open" || c.status === "in_progress"
    );

    // Categorize by age
    const categories = {
      critical: [] as Complaint[], // > 7 days
      urgent: [] as Complaint[],   // 3-7 days
      warning: [] as Complaint[],  // 1-3 days
      normal: [] as Complaint[],   // < 1 day
    };

    pendingComplaints.forEach(complaint => {
      const days = differenceInDays(now, new Date(complaint.created_at));
      if (days > 7) {
        categories.critical.push(complaint);
      } else if (days >= 3) {
        categories.urgent.push(complaint);
      } else if (days >= 1) {
        categories.warning.push(complaint);
      } else {
        categories.normal.push(complaint);
      }
    });

    return categories;
  }, [complaints]);

  const getAgeLabel = (createdAt: string) => {
    const now = new Date();
    const hours = differenceInHours(now, new Date(createdAt));
    const days = differenceInDays(now, new Date(createdAt));
    
    if (days > 0) return `${days}d ago`;
    return `${hours}h ago`;
  };

  const CategorySection = ({ 
    title, 
    items, 
    colorClass, 
    bgClass 
  }: { 
    title: string; 
    items: Complaint[]; 
    colorClass: string; 
    bgClass: string;
  }) => (
    <div className={`rounded-lg p-4 ${bgClass}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold ${colorClass}`}>{title}</h4>
        <span className={`text-2xl font-bold ${colorClass}`}>{items.length}</span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No complaints</p>
        ) : (
          items.slice(0, 5).map(complaint => (
            <div 
              key={complaint.id}
              onClick={() => onSelectComplaint?.(complaint.id)}
              className="flex items-center justify-between p-2 bg-background/50 rounded cursor-pointer hover:bg-background transition-colors"
            >
              <p className="text-sm truncate flex-1 mr-2">{complaint.title}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {getAgeLabel(complaint.created_at)}
              </span>
            </div>
          ))
        )}
        {items.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{items.length - 5} more
          </p>
        )}
      </div>
    </div>
  );

  const totalPending = Object.values(ageingData).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Complaint Ageing Heatmap
            </CardTitle>
            <CardDescription>
              Visual overview of how long complaints have been pending
            </CardDescription>
          </div>
          {ageingData.critical.length > 0 && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">
                {ageingData.critical.length} critical
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CategorySection
            title="Critical (>7 days)"
            items={ageingData.critical}
            colorClass="text-red-600 dark:text-red-400"
            bgClass="bg-red-500/10 border border-red-500/20"
          />
          <CategorySection
            title="Urgent (3-7 days)"
            items={ageingData.urgent}
            colorClass="text-orange-600 dark:text-orange-400"
            bgClass="bg-orange-500/10 border border-orange-500/20"
          />
          <CategorySection
            title="Warning (1-3 days)"
            items={ageingData.warning}
            colorClass="text-yellow-600 dark:text-yellow-400"
            bgClass="bg-yellow-500/10 border border-yellow-500/20"
          />
          <CategorySection
            title="Normal (<1 day)"
            items={ageingData.normal}
            colorClass="text-green-600 dark:text-green-400"
            bgClass="bg-green-500/10 border border-green-500/20"
          />
        </div>

        {/* Summary bar */}
        {totalPending > 0 && (
          <div className="mt-6">
            <div className="flex h-4 rounded-full overflow-hidden">
              {ageingData.critical.length > 0 && (
                <div 
                  className="bg-red-500" 
                  style={{ width: `${(ageingData.critical.length / totalPending) * 100}%` }}
                  title={`Critical: ${ageingData.critical.length}`}
                />
              )}
              {ageingData.urgent.length > 0 && (
                <div 
                  className="bg-orange-500" 
                  style={{ width: `${(ageingData.urgent.length / totalPending) * 100}%` }}
                  title={`Urgent: ${ageingData.urgent.length}`}
                />
              )}
              {ageingData.warning.length > 0 && (
                <div 
                  className="bg-yellow-500" 
                  style={{ width: `${(ageingData.warning.length / totalPending) * 100}%` }}
                  title={`Warning: ${ageingData.warning.length}`}
                />
              )}
              {ageingData.normal.length > 0 && (
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(ageingData.normal.length / totalPending) * 100}%` }}
                  title={`Normal: ${ageingData.normal.length}`}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {totalPending} pending complaints total
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
