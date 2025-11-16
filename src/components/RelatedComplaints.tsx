import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";

interface RelatedComplaint {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved";
  category: "technical" | "facilities" | "curriculum" | "mentorship" | "other";
  created_at: string;
}

interface RelatedComplaintsProps {
  complaintId: string;
  category: "technical" | "facilities" | "curriculum" | "mentorship" | "other";
}

export const RelatedComplaints = ({ complaintId, category }: RelatedComplaintsProps) => {
  const [relatedComplaints, setRelatedComplaints] = useState<RelatedComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRelatedComplaints();
  }, [complaintId, category]);

  const fetchRelatedComplaints = async () => {
    try {
      // Fetch complaints with same category, excluding current complaint
      const { data, error } = await supabase
        .from('complaints')
        .select('id, title, status, category, created_at')
        .eq('category', category)
        .neq('id', complaintId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRelatedComplaints(data || []);
    } catch (error) {
      console.error('Error fetching related complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="h-4 w-4" />
            Related Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (relatedComplaints.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link className="h-4 w-4" />
          Related Complaints
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relatedComplaints.map((complaint) => (
            <div
              key={complaint.id}
              onClick={() => navigate(`/complaint/${complaint.id}`)}
              className="p-3 rounded-lg border hover:border-primary hover:bg-accent/50 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium line-clamp-2 flex-1">
                  {complaint.title}
                </h4>
                <StatusBadge status={complaint.status} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {complaint.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
