import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrivateNotesProps {
  complaintId: string;
}

export const PrivateNotes = ({ complaintId }: PrivateNotesProps) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout>();

  useEffect(() => {
    fetchNotes();
  }, [complaintId]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("private_notes")
      .select("note")
      .eq("complaint_id", complaintId)
      .eq("student_id", user?.id)
      .maybeSingle();

    if (data) {
      setNotes(data.note);
    }
    setLoading(false);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout to save after 1 second of inactivity
    const timeout = setTimeout(async () => {
      try {
        const { data: existing } = await supabase
          .from("private_notes")
          .select("id")
          .eq("complaint_id", complaintId)
          .eq("student_id", user?.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("private_notes")
            .update({ note: value })
            .eq("id", existing.id);
        } else {
          await supabase.from("private_notes").insert({
            complaint_id: complaintId,
            student_id: user?.id,
            note: value,
          });
        }
      } catch (error) {
        console.error("Failed to save notes:", error);
      }
    }, 1000);

    setSaveTimeout(timeout);
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-lg">Private Notes</CardTitle>
        </div>
        <CardDescription>
          Only visible to you. Use this space for personal reminders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Add your private notes here..."
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Auto-saved • Not visible to admins
        </p>
      </CardContent>
    </Card>
  );
};
