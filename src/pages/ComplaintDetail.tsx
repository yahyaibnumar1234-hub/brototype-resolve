import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Comment {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

const ComplaintDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchComplaint();
      fetchComments();
    }
  }, [id]);

  const fetchComplaint = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        profiles!complaints_student_id_fkey (
          full_name,
          email
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load complaint",
        variant: "destructive",
      });
      navigate("/dashboard");
    } else {
      setComplaint(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles (
          full_name
        )
      `)
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data as any);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("comments")
      .insert({
        complaint_id: id,
        user_id: user?.id,
        message: newComment.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
      toast({
        title: "Success",
        description: "Comment added",
      });
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (newStatus: "open" | "in_progress" | "resolved") => {
    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      fetchComplaint();
      toast({
        title: "Success",
        description: "Status updated",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                <CardDescription className="mt-2">
                  {isAdmin
                    ? `Submitted by ${complaint.profiles.full_name} (${complaint.profiles.email})`
                    : `Submitted ${format(new Date(complaint.created_at), "PPP")}`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={complaint.status} />
                <UrgencyBadge urgency={complaint.urgency} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium">Category:</span>{" "}
                <span className="capitalize">{complaint.category}</span>
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {format(new Date(complaint.created_at), "PPP")}
              </div>
              {complaint.resolved_at && (
                <div>
                  <span className="font-medium">Resolved:</span>{" "}
                  {format(new Date(complaint.resolved_at), "PPP")}
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="pt-4 border-t">
                <label className="text-sm font-medium mb-2 block">
                  Update Status
                </label>
                <Select
                  value={complaint.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>
              Communication thread for this complaint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border rounded-lg p-4 bg-muted/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">
                        {comment.profiles.full_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(comment.created_at), "PPp")}
                      </span>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {comment.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="mb-2"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ComplaintDetail;
