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
import { ArrowLeft, Send, Loader2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ComplaintTimeline } from "@/components/ComplaintTimeline";
import { PrivateNotes } from "@/components/PrivateNotes";
import { FeedbackModal } from "@/components/FeedbackModal";
import { TagManager } from "@/components/TagManager";
import { AISuggestions } from "@/components/AISuggestions";
import { ComplaintSummary } from "@/components/ComplaintSummary";
import { ResponseTemplates } from "@/components/ResponseTemplates";
import { AIDraftReply } from "@/components/AIDraftReply";
import { RelatedComplaints } from "@/components/RelatedComplaints";
import { ReportAgainButton } from "@/components/ReportAgainButton";
import { ComplaintGrouping } from "@/components/ComplaintGrouping";
import { AdminReplyReactions } from "@/components/AdminReplyReactions";
interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}
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
  } | null;
}
interface Comment {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  } | null;
}
const ComplaintDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const {
    user,
    isAdmin
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    if (id) {
      fetchComplaint();
      fetchComments();
      fetchAttachments();
    }
  }, [id]);
  const fetchComplaint = async () => {
    const {
      data,
      error
    } = await supabase.from("complaints").select(`
        *,
        profiles!complaints_student_id_fkey (
          full_name,
          email
        )
      `).eq("id", id).single();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load complaint",
        variant: "destructive"
      });
      navigate("/dashboard");
    } else {
      setComplaint(data);

      // Mark as viewed by admin
      if (isAdmin && !data.viewed_by_admin) {
        await supabase.from("complaints").update({
          viewed_by_admin: true
        }).eq("id", id);
      }
    }
    setLoading(false);
  };
  const fetchComments = async () => {
    const {
      data,
      error
    } = await supabase.from("comments").select(`
        *,
        profiles (
          full_name
        )
      `).eq("complaint_id", id).order("created_at", {
      ascending: true
    });
    if (!error && data) {
      setComments(data as any);
    }
  };
  const fetchAttachments = async () => {
    const {
      data,
      error
    } = await supabase.from("attachments").select("*").eq("complaint_id", id).order("created_at", {
      ascending: true
    });
    if (!error && data) {
      setAttachments(data);
    }
  };
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const {
      error
    } = await supabase.from("comments").insert({
      complaint_id: id,
      user_id: user?.id,
      message: newComment.trim()
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } else {
      setNewComment("");
      fetchComments();
      toast({
        title: "Success",
        description: "Comment added"
      });
    }
    setSubmitting(false);
  };
  const handleStatusChange = async (newStatus: "open" | "in_progress" | "resolved") => {
    const {
      error
    } = await supabase.from("complaints").update({
      status: newStatus
    }).eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    } else {
      fetchComplaint();
      toast({
        title: "Success",
        description: "Status updated"
      });
    }
  };
  const handleReopenComplaint = async () => {
    setSubmitting(true);
    const {
      error
    } = await supabase.from("complaints").update({
      status: "open",
      resolved_at: null
    }).eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to reopen complaint",
        variant: "destructive"
      });
    } else {
      fetchComplaint();
      toast({
        title: "Success",
        description: "Complaint reopened successfully"
      });
    }
    setSubmitting(false);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!complaint) return null;
  return <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-xl font-sans font-bold">
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
                <CardDescription className="mt-2 text-[#3a3a3a]">
                  {isAdmin ? `Submitted by ${complaint.profiles?.full_name || 'Unknown Student'} (${complaint.profiles?.email || 'N/A'})` : `Submitted ${format(new Date(complaint.created_at), "PPP")}`}
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
              <p className="whitespace-pre-wrap text-[#474747]">
                {complaint.description}
              </p>
            </div>
            <div className="flex gap-4 text-sm text-[#191919]">
              <div>
                <span className="font-medium">Category:</span>{" "}
                <span className="capitalize">{complaint.category}</span>
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {format(new Date(complaint.created_at), "PPP")}
              </div>
              {complaint.resolved_at && <div>
                  <span className="font-medium">Resolved:</span>{" "}
                  {format(new Date(complaint.resolved_at), "PPP")}
                </div>}
            </div>

            {attachments.length > 0 && <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Attachments
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {attachments.map(attachment => <a key={attachment.id} href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors">
                      <img src={attachment.file_url} alt={attachment.file_name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm px-2 text-center truncate max-w-full">
                          {attachment.file_name}
                        </span>
                      </div>
                    </a>)}
                </div>
              </div>}

            {!isAdmin && complaint.status === "resolved" && <div className="pt-4 border-t">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Not Satisfied with Resolution?</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    If you feel the issue wasn't fully resolved, you can reopen this complaint or report it again.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReopenComplaint} disabled={submitting}>
                      {submitting ? "Reopening..." : "Reopen Complaint"}
                    </Button>
                    <ReportAgainButton originalComplaint={{
                      id: complaint.id,
                      title: complaint.title,
                      description: complaint.description,
                      category: complaint.category,
                    }} />
                  </div>
                </div>
              </div>}

            {!isAdmin && complaint.status !== "resolved" && (
              <div className="pt-4 border-t flex gap-2">
                <ComplaintGrouping 
                  currentComplaintId={complaint.id}
                  currentTitle={complaint.title}
                />
              </div>
            )}

            {isAdmin && <div className="pt-4 border-t">
                <label className="text-sm font-medium mb-2 block">
                  Update Status
                </label>
                <Select value={complaint.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>
                Communication thread for this complaint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 ? <p className="text-center text-muted-foreground py-4">
                  No comments yet. Be the first to comment!
                </p> : <div className="space-y-4">
                  {comments.map((comment, index) => {
                    const isAdminReply = isAdmin ? false : index > 0 || comment.user_id !== user?.id;
                    return (
                      <div key={comment.id} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">
                            {comment.profiles?.full_name || 'Unknown User'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(comment.created_at), "PPp")}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-[#454545]">
                          {comment.message}
                        </p>
                        {/* Show reactions for admin replies (when student is viewing) */}
                        {!isAdmin && isAdminReply && (
                          <AdminReplyReactions commentId={comment.id} />
                        )}
                      </div>
                    );
                  })}
                </div>}

              <div className="pt-4 border-t">
                <Textarea placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} className="mb-2" />
                <Button onClick={handleAddComment} disabled={!newComment.trim() || submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>

          {isAdmin && <div className="space-y-2">
              <AIDraftReply complaint={complaint} onReplyGenerated={reply => setNewComment(reply)} />
              <ResponseTemplates onSelectTemplate={template => setNewComment(template)} />
            </div>}
        </div>

        {isAdmin && complaint && <div className="mt-6 space-y-6">
            <RelatedComplaints complaintId={complaint.id} category={complaint.category as "technical" | "facilities" | "curriculum" | "mentorship" | "other"} />
            <div className="grid gap-6 md:grid-cols-2">
              <ComplaintSummary complaint={complaint} />
              <AISuggestions complaint={complaint} />
            </div>
          </div>}
      </main>
    </div>;
};
export default ComplaintDetail;