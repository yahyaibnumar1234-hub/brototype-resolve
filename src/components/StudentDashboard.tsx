import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, MessageSquare } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  updated_at: string;
}

const StudentDashboard = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("student_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive",
      });
    } else {
      setComplaints(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">My Complaints</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/complaint/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Complaint
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No complaints yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit your first complaint to get started
              </p>
              <Button onClick={() => navigate("/complaint/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <Card
                key={complaint.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/complaint/${complaint.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{complaint.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatDistanceToNow(new Date(complaint.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge status={complaint.status} />
                      <UrgencyBadge urgency={complaint.urgency} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">
                    {complaint.description}
                  </p>
                  <div className="mt-2">
                    <span className="text-sm font-medium capitalize">
                      {complaint.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
