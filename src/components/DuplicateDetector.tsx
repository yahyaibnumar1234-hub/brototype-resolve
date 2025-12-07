import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Copy, AlertTriangle, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DuplicateGroup {
  keyword: string;
  count: number;
  complaints: {
    id: string;
    title: string;
    student_name: string;
    created_at: string;
  }[];
}

interface DuplicateDetectorProps {
  complaints: {
    id: string;
    title: string;
    description: string;
    created_at: string;
    profiles: {
      full_name: string;
    } | null;
  }[];
  threshold?: number;
}

export const DuplicateDetector = ({ complaints, threshold = 3 }: DuplicateDetectorProps) => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    detectDuplicates();
  }, [complaints]);

  const detectDuplicates = () => {
    // Extract common keywords and group complaints
    const keywordMap = new Map<string, DuplicateGroup["complaints"]>();
    
    // Common issue keywords to look for
    const issueKeywords = [
      'wifi', 'internet', 'network', 'laptop', 'computer', 'projector',
      'ac', 'air conditioner', 'fan', 'light', 'electricity', 'power',
      'hostel', 'mess', 'food', 'water', 'toilet', 'bathroom',
      'mentor', 'faculty', 'teacher', 'class', 'schedule', 'timetable',
      'lab', 'library', 'canteen', 'parking', 'security'
    ];

    complaints.forEach(complaint => {
      const text = `${complaint.title} ${complaint.description}`.toLowerCase();
      
      issueKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          if (!keywordMap.has(keyword)) {
            keywordMap.set(keyword, []);
          }
          const group = keywordMap.get(keyword)!;
          // Avoid duplicates in same group
          if (!group.find(c => c.id === complaint.id)) {
            group.push({
              id: complaint.id,
              title: complaint.title,
              student_name: complaint.profiles?.full_name || 'Unknown',
              created_at: complaint.created_at,
            });
          }
        }
      });
    });

    // Filter groups that meet threshold
    const groups: DuplicateGroup[] = [];
    keywordMap.forEach((items, keyword) => {
      if (items.length >= threshold) {
        groups.push({
          keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          count: items.length,
          complaints: items.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        });
      }
    });

    // Sort by count descending
    setDuplicateGroups(groups.sort((a, b) => b.count - a.count));
  };

  if (duplicateGroups.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-500/30 bg-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-5 w-5" />
          Duplicate Issues Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {duplicateGroups.map((group) => (
          <div 
            key={group.keyword}
            className="rounded-lg border bg-background overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedGroup(
                expandedGroup === group.keyword ? null : group.keyword
              )}
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
                  <Users className="h-3 w-3 mr-1" />
                  {group.count}
                </Badge>
                <span className="font-medium">{group.keyword} Issues</span>
              </div>
              {expandedGroup === group.keyword ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {expandedGroup === group.keyword && (
              <div className="border-t p-3 space-y-2 bg-muted/30">
                {group.complaints.slice(0, 5).map((complaint) => (
                  <div 
                    key={complaint.id}
                    className="flex items-center justify-between p-2 rounded bg-background hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/complaint/${complaint.id}`)}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium truncate">{complaint.title}</p>
                      <p className="text-xs text-muted-foreground">{complaint.student_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {group.complaints.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{group.complaints.length - 5} more similar complaints
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-2">
          ⚠️ Similar issues from multiple students may indicate a systemic problem
        </p>
      </CardContent>
    </Card>
  );
};
