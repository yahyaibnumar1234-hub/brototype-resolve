import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

interface Complaint {
  created_at: string;
}

interface ComplaintHeatmapProps {
  complaints: Complaint[];
}

export const ComplaintHeatmap = ({ complaints }: ComplaintHeatmapProps) => {
  const heatmapData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Initialize grid
    const grid: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
    
    // Count complaints by day and hour
    complaints.forEach(complaint => {
      const date = new Date(complaint.created_at);
      const day = date.getDay();
      const hour = date.getHours();
      grid[day][hour]++;
    });
    
    // Find max value for color scaling
    const maxValue = Math.max(...grid.flat(), 1);
    
    return { grid, maxValue, dayNames, hours };
  }, [complaints]);

  const getColorIntensity = (value: number) => {
    if (value === 0) return 'bg-muted/30';
    const intensity = Math.min((value / heatmapData.maxValue) * 100, 100);
    if (intensity < 25) return 'bg-primary/20';
    if (intensity < 50) return 'bg-primary/40';
    if (intensity < 75) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaint Heatmap</CardTitle>
        <CardDescription>When do most complaints come in? (Day vs Hour)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels */}
            <div className="flex mb-2">
              <div className="w-12"></div>
              {heatmapData.hours.map(hour => (
                <div key={hour} className="w-8 text-center text-xs text-muted-foreground">
                  {hour % 6 === 0 ? hour : ''}
                </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            {heatmapData.grid.map((row, dayIndex) => (
              <div key={dayIndex} className="flex items-center mb-1">
                <div className="w-12 text-sm text-muted-foreground pr-2">
                  {heatmapData.dayNames[dayIndex]}
                </div>
                {row.map((value, hourIndex) => (
                  <div
                    key={hourIndex}
                    className={`w-8 h-8 mx-px rounded-sm ${getColorIntensity(value)} transition-colors cursor-pointer hover:ring-2 hover:ring-primary relative group`}
                    title={`${heatmapData.dayNames[dayIndex]} ${hourIndex}:00 - ${value} complaints`}
                  >
                    <div className="absolute hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg z-10 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      {value} complaints
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-muted/30 rounded-sm"></div>
            <div className="w-4 h-4 bg-primary/20 rounded-sm"></div>
            <div className="w-4 h-4 bg-primary/40 rounded-sm"></div>
            <div className="w-4 h-4 bg-primary/60 rounded-sm"></div>
            <div className="w-4 h-4 bg-primary/80 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};
