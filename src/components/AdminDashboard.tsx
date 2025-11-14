import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Search, BarChart3, Download, TrendingUp, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ComplaintHeatmap } from "@/components/ComplaintHeatmap";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isComplaintOverdue, getOverdueHours } from "@/utils/slaTimer";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  student_id: string;
  starred: boolean;
  profiles: {
    full_name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [selectedComplaints, setSelectedComplaints] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchQuery, statusFilter, urgencyFilter]);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        profiles!complaints_student_id_fkey (
          full_name,
          email
        )
      `)
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

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (urgencyFilter !== "all") {
      filtered = filtered.filter((c) => c.urgency === urgencyFilter);
    }

    setFilteredComplaints(filtered);
  };

  const toggleSelectAll = () => {
    if (selectedComplaints.size === filteredComplaints.length) {
      setSelectedComplaints(new Set());
    } else {
      setSelectedComplaints(new Set(filteredComplaints.map(c => c.id)));
    }
  };

  const toggleSelectComplaint = (id: string) => {
    const newSelected = new Set(selectedComplaints);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedComplaints(newSelected);
  };

  const handleBulkStatusUpdate = async (newStatus: "open" | "in_progress" | "resolved") => {
    if (selectedComplaints.size === 0) return;
    
    setBulkActionLoading(true);
    try {
      const updates = Array.from(selectedComplaints).map(id =>
        supabase
          .from("complaints")
          .update({ status: newStatus })
          .eq("id", id)
      );
      
      await Promise.all(updates);
      
      toast({
        title: "Success",
        description: `Updated ${selectedComplaints.size} complaint(s)`,
      });
      
      setSelectedComplaints(new Set());
      fetchComplaints();
    } catch (error) {
      console.error("Bulk update error:", error);
      toast({
        title: "Error",
        description: "Failed to update complaints",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleStarToggle = async (id: string, currentStarred: boolean) => {
    const { error } = await supabase
      .from("complaints")
      .update({ starred: !currentStarred })
      .eq("id", id);

    if (!error) {
      fetchComplaints();
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV(filteredComplaints as any);
    } else {
      exportToPDF(filteredComplaints as any);
    }
    toast({
      title: "Export successful",
      description: `Complaints exported as ${format.toUpperCase()}`,
    });
  };

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Complaints</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open</CardDescription>
              <CardTitle className="text-3xl text-status-open">{stats.open}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl text-status-inProgress">
                {stats.inProgress}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-3xl text-status-resolved">
                {stats.resolved}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="complaints" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="complaints">
                <Search className="h-4 w-4 mr-2" />
                Complaints
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="heatmap">
                <TrendingUp className="h-4 w-4 mr-2" />
                Heatmap
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportToCSV(complaints as any, `complaints-${new Date().toISOString().split('T')[0]}.csv`)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => exportToPDF(complaints as any, `complaints-${new Date().toISOString().split('T')[0]}.pdf`)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <TabsContent value="complaints" className="space-y-6">
            {selectedComplaints.size > 0 && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {selectedComplaints.size} complaint(s) selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkStatusUpdate("in_progress")}
                        disabled={bulkActionLoading}
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkStatusUpdate("resolved")}
                        disabled={bulkActionLoading}
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedComplaints(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedComplaints.size === filteredComplaints.length && filteredComplaints.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Select All ({filteredComplaints.length})
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search complaints..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Urgency</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Complaints List */}
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredComplaints.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || urgencyFilter !== "all"
                      ? "Try adjusting your filters"
                      : "No complaints have been submitted yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((complaint) => {
                  const isOverdue = isComplaintOverdue(
                    complaint.created_at,
                    complaint.status,
                    complaint.resolved_at
                  );
                  const overdueHours = getOverdueHours(complaint.created_at);

                  return (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedComplaints.has(complaint.id)}
                            onCheckedChange={() => toggleSelectComplaint(complaint.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{complaint.title}</h3>
                                  {isOverdue && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Overdue {Math.round(overdueHours)}h
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  By {complaint.profiles?.full_name || 'Unknown Student'} •{" "}
                                  {formatDistanceToNow(new Date(complaint.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/complaint/${complaint.id}`)}
                              >
                                View Details
                              </Button>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 mb-3">
                              {complaint.description}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium capitalize px-2 py-1 bg-muted rounded">
                                {complaint.category}
                              </span>
                              <StatusBadge status={complaint.status} />
                              <UrgencyBadge urgency={complaint.urgency} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard complaints={complaints as any} />
          </TabsContent>

          <TabsContent value="heatmap">
            <ComplaintHeatmap complaints={complaints} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
