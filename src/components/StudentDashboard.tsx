import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, MessageSquare, Filter } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookmarkButton } from "@/components/BookmarkButton";
import { QRStatusCheck } from "@/components/QRStatusCheck";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  updated_at: string;
  starred: boolean;
}

const StudentDashboard = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, statusFilter, categoryFilter, searchQuery]);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("id, title, description, category, urgency, status, created_at, updated_at, starred")
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

  const filterComplaints = () => {
    let filtered = [...complaints];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query)
      );
    }

    setFilteredComplaints(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b glass-card sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">My Complaints</h1>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <ThemeToggle />
              <Button 
                onClick={() => navigate("/complaint/new")}
                className="flex-1 sm:flex-none"
                variant="neon"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
              <Button variant="ghost" onClick={signOut} className="flex-1 sm:flex-none">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Filters */}
        <Card className="mb-6 animate-fade-in glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-5 w-5 text-primary" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-card border-border backdrop-blur-xl">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-card border-border backdrop-blur-xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="facilities">Facilities</SelectItem>
                    <SelectItem value="curriculum">Curriculum</SelectItem>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="fees">Fees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card className="animate-fade-in glass-card">
            <CardContent className="py-12 text-center">
              <div className="animate-shimmer">Loading...</div>
            </CardContent>
          </Card>
        ) : filteredComplaints.length === 0 && complaints.length === 0 ? (
          <Card className="animate-fade-in glass-card">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-float" />
              <h3 className="text-lg font-semibold mb-2">No complaints yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit your first complaint to get started
              </p>
              <Button onClick={() => navigate("/complaint/new")} variant="neon">
                <Plus className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
            </CardContent>
          </Card>
        ) : filteredComplaints.length === 0 ? (
          <Card className="animate-fade-in glass-card">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {filteredComplaints.map((complaint, index) => (
              <Card
                key={complaint.id}
                className="glass-card cursor-pointer hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-glow"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/complaint/${complaint.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">
                        {complaint.title}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm">
                        {formatDistanceToNow(new Date(complaint.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      <StatusBadge status={complaint.status} />
                      <UrgencyBadge urgency={complaint.urgency} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2 text-sm mb-3">
                    {complaint.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {complaint.category}
                    </span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <BookmarkButton
                        complaintId={complaint.id}
                        isBookmarked={complaint.starred || false}
                        onToggle={() => fetchComplaints()}
                      />
                      <QRStatusCheck
                        complaintId={complaint.id}
                        title={complaint.title}
                      />
                    </div>
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
